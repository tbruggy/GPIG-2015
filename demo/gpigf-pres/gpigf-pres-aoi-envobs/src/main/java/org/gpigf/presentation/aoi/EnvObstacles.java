package org.gpigf.presentation.aoi;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import org.geotools.process.factory.DescribeParameter;
import org.geotools.process.factory.DescribeProcess;
import org.geotools.process.factory.DescribeResult;
import org.geotools.process.factory.StaticMethodsProcessFactory;
import org.geotools.text.Text;
import org.postgis.PGgeometry;

import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.io.WKTReader;

public class EnvObstacles extends StaticMethodsProcessFactory<EnvObstacles>
{
	public EnvObstacles() {
		super(Text.text("Environmental Obstacles"), "gpigf", EnvObstacles.class);
	}
	
	@DescribeProcess(title = "saveEnvObstacles", description = "Save environmental obstacles to the database")
	@DescribeResult(description = "Saved environmental obstacle")
	public static GeometryCollection saveEnvObstacles(
			@DescribeParameter(name = "target_areas", description = "Polygon of environmental obstacle(s)") GeometryCollection target_areas) {
		
		if (target_areas == null || target_areas.getNumGeometries() == 0) {
			throw new IllegalArgumentException("target_areas is null or zero in size");
		}
		
		startLogger();
		startDBConnection();
		
		try {
			PreparedStatement statement = conn.prepareStatement("INSERT into env_obstacles (geom) VALUES (?)");
			
			for (int i = 0; i < target_areas.getNumGeometries(); ++i) {
				Geometry geometry = target_areas.getGeometryN(i);
	
				statement.setObject(1, new PGgeometry(geometry.toText()));
	  
				if (statement.executeUpdate() > 0) {
					out.println("Successful insert");
				} else {
					out.println("Failed insert");
				}
			}
			
			statement.close();
		} catch (Exception e) {
			e.printStackTrace(out);
		}
		
		return target_areas;
	}
	
	@DescribeProcess(title = "processRoads", description = "Calculates new size of target areas based upon roads")
	@DescribeResult(description = "Modified target areas")
	public static GeometryCollection processRoads(
			@DescribeParameter(name = "target_areas", description = "Target area polygon") GeometryCollection target_areas,
			@DescribeParameter(name = "road_growth", description = "Growth along roads") int road_growth,
			@DescribeParameter(name = "ext_target_area", description = "Distance to check for roads") int ext_target_area) {
		
		if (target_areas == null || target_areas.getNumGeometries() == 0) {
			throw new IllegalArgumentException("target_areas is null or zero in size");
		}
		
		startLogger();
		startDBConnection();
		
		GeometryCollection roads = getRoads(target_areas.getFactory());
		
		List<Geometry> geometryOutput = new ArrayList<Geometry>();
		
		for (int i = 0; i < target_areas.getNumGeometries(); i++) {
			Geometry area = target_areas.getGeometryN(i);
			Geometry largerArea = area.buffer(ext_target_area, 5);
			
			List<Geometry> output = new ArrayList<Geometry>();
			out.println("Detecting road intersections");
			
			for (int j = 0; j < roads.getNumGeometries(); j++) {
				Geometry road = roads.getGeometryN(j);
				if (largerArea.intersects(road)) {
					Geometry intersection = largerArea.intersection(road);
					Geometry bufferedRoad = intersection.buffer(road_growth, 5);
					output.add(bufferedRoad);
					out.println("Road intersection detected");
				}
			}
			
			output.add(area);
			// buffer(0.0) achieves the same thing as union() but is faster
			geometryOutput.add(toGeometryCollection(area, output).buffer(0.0));
		}
		
		return toGeometryCollection(target_areas, geometryOutput);
	}
		
	@DescribeProcess(title = "processEnvObstacles", description = "Calculates new size of target areas based upon environmental obstacles")
	@DescribeResult(description = "Modified target areas")
	public static GeometryCollection processEnvObstacles(
			@DescribeParameter(name = "target_areas", description = "Target area polygon") GeometryCollection target_areas,
			@DescribeParameter(name = "env_obstacles", description = "Growth along roads") GeometryCollection env_obstacles) {
			
			if (target_areas == null || target_areas.getNumGeometries() == 0) {
				throw new IllegalArgumentException("target_areas is null or zero in size");
			}
			
			List<Geometry> geometryOutput = new ArrayList<Geometry>();
			Geometry obstacles = env_obstacles.union();
			
			for (int i = 0; i < target_areas.getNumGeometries(); i++) {
				Geometry area = target_areas.getGeometryN(i);
				geometryOutput.add(area.difference(obstacles));
			}
		
		return toGeometryCollection(target_areas, geometryOutput);
	}
	
	private static java.sql.Connection conn;
	private static PrintWriter out = null;
	
	private static GeometryCollection toGeometryCollection(Geometry geometry, List<Geometry> geometryList) {
		return geometry.getFactory().createGeometryCollection(GeometryFactory.toGeometryArray(geometryList));
	}
		
	private static GeometryCollection getRoads(GeometryFactory factory) {
		out.println("Attempting to get roads");
		List<Geometry> output = getGeometries("SELECT st_astext(st_transform(ST_LineMerge(geom),3857)) FROM nyc_roads");
		out.println("Finished getting roads");
		return factory.createGeometryCollection(GeometryFactory.toGeometryArray(output));
	}

	private static List<Geometry> getGeometries(String sql) {
		List<Geometry> output = new ArrayList<Geometry>();
		
		try {
			Statement query = conn.createStatement();
			ResultSet results = query.executeQuery(sql);
			
			while (results.next()) {
				WKTReader wktReader = new WKTReader();
				Geometry geometry = wktReader.read((String)results.getObject(1));
				output.add(geometry);
				out.println("Read from database: " + geometry.toText());
			}
			
			query.close();
		} catch (Exception e) {
			System.out.println(e.getMessage());
		}
		
		return output;
	}

	private static void startDBConnection() {
		try {
			Class.forName("org.postgresql.Driver"); 
			String url = "jdbc:postgresql://localhost:5432/RoadsDB"; 
			conn = DriverManager.getConnection(url, "postgres", "geoserver"); 
			((org.postgresql.PGConnection)conn).addDataType("geometry",Class.forName("org.postgis.PGgeometry"));
		} catch (Exception e ) {
			e.printStackTrace(out);
		}
	}
	
	private static void startLogger() {
		try {
			if (out == null) {
				out = new PrintWriter(new BufferedWriter(new FileWriter("C:\\Users\\Paul\\Desktop\\out.log", false)), true);
			}
		} catch (IOException ex) {
			ex.printStackTrace();
		}
		
		out.println("log started");
	}
	
}
