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

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.LineString;
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

public class AgentStore extends StaticMethodsProcessFactory<AgentStore> {
	static java.sql.Connection conn;
	static PrintWriter out = null;
    

	public AgentStore() {
		super(Text.text("AgentsStore"), "gpigf", AgentStore.class);
		
		try {
			if (out == null) {
				out = new PrintWriter(new BufferedWriter(new FileWriter("C:\\Users\\Paul\\Desktop\\out3.log", false)), true);
			}
		} catch (IOException ex) {
			ex.printStackTrace();
		}
		
		out.println("agents2: log started");

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
	
	@DescribeProcess(title = "pushAgents", description = "Pushes agents to the db")
	@DescribeResult(description = "push geometries")
	public static GeometryCollection pushAgents(
			@DescribeParameter(name = "agents", description = "Agent geometries") GeometryCollection agents,
			@DescribeParameter(name = "tablename", description = "Name of table in DB") String tablename) {

		if (agents == null || agents.getNumGeometries() == 0)
			throw new IllegalArgumentException("agents is null or zero in size");
		
		try {
			PreparedStatement s = conn.prepareStatement(String.format("INSERT INTO %s (srid, agents) VALUES (?, ?)", tablename));
			
			
			//for (int i = 0; i < agents.getNumGeometries(); ++i) {
			//	Geometry geo = agents.getGeometryN(i);
				
				
				s.setInt(1, agents.getFactory().getSRID());
				s.setObject(2, new PGgeometry(agents.toText()));
				
				int rows = s.executeUpdate();
	 
				if (rows > 0) {
					//out.println("Successful insert");
				} else {
					//out.println("Failed insert");
				}
			//}
			s.close();
		} catch (Exception e) {
			e.printStackTrace(out);
		}

		return agents;
	}
	
	@DescribeProcess(title = "popPosition", description = "Pops a specific position of agents from the db")
	@DescribeResult(description = "popped geometry")
	public static GeometryCollection popPosition(
			@DescribeParameter(name = "posNum", description = "The position number") int posNum,
			@DescribeParameter(name = "tablename", description = "Name of table in DB") String tablename) {

		if (posNum <= 0)
			throw new IllegalArgumentException("posNum is not positive - numbers start at 1");
		
		List output = new ArrayList();
		GeometryFactory f = null;

		try {
			Statement qs = conn.createStatement();
			ResultSet r = qs.executeQuery(String.format("SELECT srid,st_astext(agents) as poly FROM %s", tablename));
			
			while (r.next()) {
				if (r.getRow() == posNum){
					if (f == null) {
						int srid = r.getInt(1);
						
						f = new GeometryFactory(new PrecisionModel(), srid);
					}
					String wkt = (String)r.getObject(2);
					//out.println(wkt);
					//out.println(r.getObject(2));
					WKTReader wktReader = new WKTReader();
					Geometry geo = wktReader.read(wkt);
		
					out.println("read from db : " + geo.toText());
					//output.add(geo);
					return (GeometryCollection) geo;
				}
			}
			
			qs.close();
		} catch (Exception e) {
			e.printStackTrace(out);
		}

		out.println("done");

		// The param is used to get the right factory
		return f.createGeometryCollection(GeometryFactory.toGeometryArray(output));
	}
	
	@DescribeProcess(title = "popAgents", description = "Pops agents from the db")
	@DescribeResult(description = "popped geometry")
	public static GeometryCollection popAgents(
			@DescribeParameter(name = "agents", description = "Agent geometries") GeometryCollection agents,
			@DescribeParameter(name = "tablename", description = "Name of table in DB") String tablename) {

		if (agents == null || agents.getNumGeometries() == 0)
			throw new IllegalArgumentException("agents is null or zero in size");
		
		List output = new ArrayList();
		GeometryFactory f = null;

		try {
			Statement qs = conn.createStatement();
			ResultSet r = qs.executeQuery(String.format("SELECT srid,st_astext(agents) as poly FROM %s", tablename));
			
			while (r.next()) {
				if (f == null) {
					int srid = r.getInt(1);
					
					f = new GeometryFactory(new PrecisionModel(), srid);
				}
				String wkt = (String)r.getObject(2);
	
				WKTReader wktReader = new WKTReader();
				Geometry geo = wktReader.read(wkt);
	
				//out.println("read from db : " + geo.toText());
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
	
	@DescribeProcess(title = "agentDigArea", description = "Subtracts an agents path from a target area, using old and new positions")
	@DescribeResult(description = "Modified target areas")
	public static GeometryCollection agentDigArea(
			@DescribeParameter(name = "target_areas", description = "Target area polygon") GeometryCollection target_areas,
			@DescribeParameter(name = "previous_positions", description = "Previous positions of agents") GeometryCollection previous_positions,
			@DescribeParameter(name = "new_positions", description = "New positions of agents") GeometryCollection new_positions,
			@DescribeParameter(name = "agent_vision", description = "Radius of agents vision") int agent_vision) 
					throws IllegalArgumentException {
		out.println("Called");

		if (target_areas == null || previous_positions == null || new_positions == null)
			out.println("null");
		
		out.println("target_areas : " + target_areas.toText());
		out.println("previous_positions : " + previous_positions.toText());
		out.println("new_positions : " + new_positions.toText());
		out.println("agent_vision : " + agent_vision);
		
		if (target_areas == null || target_areas.getNumGeometries() == 0)
			throw new IllegalArgumentException("target_areas is null or zero in size");
		
		List<Geometry> paths = new ArrayList<Geometry>();
		for (int i=0; i < previous_positions.getNumGeometries(); ++i){
			Geometry previous_pos = previous_positions.getGeometryN(i);
			Geometry next_pos = new_positions.getGeometryN(i);
			
			Coordinate[] line_coords = new Coordinate[2];
			line_coords[0] = previous_pos.getCoordinate();
			line_coords[1] = next_pos.getCoordinate();
			
			LineString path = new LineString(line_coords, new PrecisionModel(), 0);
			Geometry visioned_path = path.buffer(agent_vision, 5);
			
			paths.add(visioned_path);
		}

		Geometry agent_paths = toGeometryCollection(target_areas, paths).union();
		
		out.println("place 1");
		List<Geometry> output = new ArrayList<Geometry>();
		
		for (int i = 0; i < target_areas.getNumGeometries(); ++i) {
			Geometry target_area = target_areas.getGeometryN(i);
			output.add(target_area.difference(agent_paths));
		}

		out.println("place 2");
		return target_areas.getFactory().createGeometryCollection(GeometryFactory.toGeometryArray(output));
	}
	
	private static GeometryCollection toGeometryCollection(Geometry geometry, List<Geometry> geometryList) {
		return geometry.getFactory().createGeometryCollection(GeometryFactory.toGeometryArray(geometryList));
	}
}