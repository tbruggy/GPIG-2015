package org.gpigf.presentation.aoi;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import org.geotools.process.factory.DescribeParameter;
import org.geotools.process.factory.DescribeProcess;
import org.geotools.process.factory.DescribeResult;
import org.geotools.process.factory.StaticMethodsProcessFactory;
import org.geotools.text.Text;

import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.io.WKTReader;

public class EnvObstacles extends StaticMethodsProcessFactory<EnvObstacles>
{
	public EnvObstacles() {
		super(Text.text("Environmental Obstacles"), "gpigf", EnvObstacles.class);
	}
	
	@DescribeProcess(title = "processEnvObstacles", description = "Calculates new size of target areas based upon environmental obstacles")
	@DescribeResult(description = "Modified target areas")
	public static GeometryCollection processEnvObstacles(
			@DescribeParameter(name = "target_areas", description = "Target area polygon") GeometryCollection target_areas) {
		
		if (target_areas == null || target_areas.getNumGeometries() == 0)
			throw new IllegalArgumentException("target_areas is null or zero in size");
		
		return GetRoads(target_areas);
	}
	
	private static java.sql.Connection conn;
	private static PrintWriter out = null;
	
	public static GeometryCollection GetRoads(GeometryCollection target_areas) {
		try {
			if (out == null) {
				out = new PrintWriter(new BufferedWriter(new FileWriter("C:\\Users\\tbrug_000\\Desktop\\out.log", false)), true);
			}
		} catch (IOException ex) {
			ex.printStackTrace();
		}
		
		out.println("log started");

		try {
			Class.forName("org.postgresql.Driver"); 
			String url = "jdbc:postgresql://localhost:5432/RoadsDB"; 
			conn = DriverManager.getConnection(url, "postgres", "geoserver"); 
			((org.postgresql.PGConnection)conn).addDataType("geometry",Class.forName("org.postgis.PGgeometry"));
		} catch (Exception e ) { 
			e.printStackTrace(out);
		}
		
		List output = new ArrayList();
		
		try {
			Statement qs = conn.createStatement();
			ResultSet r = qs.executeQuery("select st_astext(st_buffer(st_transform(ST_LineMerge(geom),3857), 10)) from nyc_roads");
			
			while (r.next()) {
				String wkt = (String)r.getObject(1);
	
				WKTReader wktReader = new WKTReader();
				Geometry geo = wktReader.read(wkt);
	
				out.println("read from db : " + geo.toText());
				output.add(geo);
			}
			
			qs.close();
		} catch (Exception e) {
			System.out.println(e.getMessage());
		}

		out.println("done");
		
		// The param is used to get the right factory
		return target_areas.getFactory().createGeometryCollection(GeometryFactory.toGeometryArray(output));
	}
}