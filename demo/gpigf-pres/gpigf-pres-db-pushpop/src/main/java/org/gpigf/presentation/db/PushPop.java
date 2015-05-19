package org.gpigf.presentation.db;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;

import org.postgis.*;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.PrecisionModel;
import com.vividsolutions.jts.geom.util.LineStringExtracter;
import com.vividsolutions.jts.io.WKBReader;
import com.vividsolutions.jts.io.WKTReader;
import com.vividsolutions.jts.operation.polygonize.Polygonizer;

import org.geotools.process.factory.DescribeParameter;
import org.geotools.process.factory.DescribeProcess;
import org.geotools.process.factory.DescribeResult;
import org.geotools.process.factory.StaticMethodsProcessFactory;
import org.geotools.text.Text;

public class PushPop extends StaticMethodsProcessFactory<PushPop> {
	static java.sql.Connection conn;
	static PrintWriter out = null;
    

	public PushPop() {
		super(Text.text("PushPop"), "gpigf", PushPop.class);
		
		try {
			if (out == null) {
				out = new PrintWriter(new BufferedWriter(new FileWriter("C:\\Users\\Paul\\Desktop\\out.log", false)), true);
			}
		} catch (IOException ex) {
			ex.printStackTrace(); 
		}
		
		out.println("log started");

		try {
			Class.forName("org.postgresql.Driver"); 
			String url = "jdbc:postgresql://localhost:5432/RoadsDB"; 
			conn = DriverManager.getConnection(url, "postgres", "geoserver"); 
			
			//if(!(conn instanceof org.postgresql.jdbc4.Jdbc4Connection))
			//{
			//	System.out.println("Connection is not instance of org.postgresql.jdbc4.Jdbc4Connection");
			//	System.out.println("It is of type of " + conn.toString());
			//	return;
			//}
			
			((org.postgresql.PGConnection)conn).addDataType("geometry",Class.forName("org.postgis.PGgeometry"));
		} catch (Exception e ) { 
			e.printStackTrace(out);
		}
	}

	@DescribeProcess(title = "push", description = "Pushes a geometry to the db")
	@DescribeResult(description = "push geometries")
	public static Geometry push(
			@DescribeParameter(name = "target_areas", description = "Target area polygon") GeometryCollection target_areas) {

		if (target_areas == null || target_areas.getNumGeometries() == 0)
			throw new IllegalArgumentException("target_areas is null or zero in size");
		
		try {
			PreparedStatement s = conn.prepareStatement("INSERT INTO save (large_poly, srid, precision) VALUES (?, ?, ?)");
			
			for (int i = 0; i < target_areas.getNumGeometries(); ++i) {
				Geometry geo = target_areas.getGeometryN(i);
				
				s.setObject(1, new PGgeometry(geo.toText()));
				s.setInt(2, geo.getFactory().getSRID());
				s.setString(3, geo.getFactory().getPrecisionModel().getType().toString());
	 
				int rows = s.executeUpdate();
	 
				if (rows > 0) {
					out.println("Successful insert");
				} else {
					out.println("Failed insert");
				}
			}
			s.close();
		} catch (Exception e) {
			e.printStackTrace(out);
		}

		return target_areas;
	}

	@DescribeProcess(title = "pop", description = "Pops a geometry from the db")
	@DescribeResult(description = "popped geometry")
	public static GeometryCollection pop(
			@DescribeParameter(name = "target_areas", description = "Target area polygon") GeometryCollection target_areas) {

		if (target_areas == null || target_areas.getNumGeometries() == 0)
			throw new IllegalArgumentException("target_areas is null or zero in size");
		
		List output = new ArrayList();
		GeometryFactory f = null;

		try {
			Statement qs = conn.createStatement();
			ResultSet r = qs.executeQuery("SELECT srid,precision,st_astext(large_poly) as poly FROM save");
			
			while (r.next()) {
				if (f == null) {
					int srid = r.getInt(1);
					String precision = (String)r.getObject(2);
					
					f = new GeometryFactory(new PrecisionModel(), srid);
				}
				String wkt = (String)r.getObject(3);
	
				WKTReader wktReader = new WKTReader();
				Geometry geo = wktReader.read(wkt);
	
				out.println("read from db : " + geo.toText());
				output.add(geo);
			}
			
			qs.close();
		} catch (Exception e) {
			e.printStackTrace(out);
		}

		out.println("done");

		// The param is used to get the right factory
		return f.createGeometryCollection(GeometryFactory.toGeometryArray(output));
	}
}