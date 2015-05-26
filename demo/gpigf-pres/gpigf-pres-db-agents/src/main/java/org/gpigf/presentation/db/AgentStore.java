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

public class AgentStore extends StaticMethodsProcessFactory<AgentStore> {
	static java.sql.Connection conn;
	static PrintWriter out = null;
    

	public AgentStore() {
		super(Text.text("AgentsStore"), "gpigf", AgentStore.class);
		
		try {
			if (out == null) {
				out = new PrintWriter(new BufferedWriter(new FileWriter("C:\\Users\\Jack\\Desktop\\out2.log", false)), true);
			}
		} catch (IOException ex) {
			ex.printStackTrace();
		}
		
		out.println("agents: log started");

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

	/*
	@DescribeProcess(title = "push", description = "Pushes a geometry to the db")
	@DescribeResult(description = "push geometries")
	public static Geometry push(
			@DescribeParameter(name = "target_areas", description = "Target area polygon") GeometryCollection target_areas) {

		if (target_areas == null || target_areas.getNumGeometries() == 0)
			throw new IllegalArgumentException("target_areas is null or zero in size");
		
		try {
			PreparedStatement s = conn.prepareStatement("INSERT INTO save (srid, precision, large_poly) VALUES (?, ?, ?)");
			
			for (int i = 0; i < target_areas.getNumGeometries(); ++i) {
				Geometry geo = target_areas.getGeometryN(i);
				
				
				s.setInt(1, geo.getFactory().getSRID());
				s.setString(2, geo.getFactory().getPrecisionModel().getType().toString());
				s.setObject(3, new PGgeometry(geo.toText()));
				
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
	}*/
	
	@DescribeProcess(title = "pushAgents", description = "Pushes agents to the db")
	@DescribeResult(description = "push geometries")
	public static GeometryCollection pushAgents(
			@DescribeParameter(name = "agents", description = "Agent geometries") GeometryCollection agents) {

		if (agents == null || agents.getNumGeometries() == 0)
			throw new IllegalArgumentException("agents is null or zero in size");
		
		try {
			PreparedStatement s = conn.prepareStatement("INSERT INTO agentsave (srid, agents) VALUES (?, ?)");
			
			
			//for (int i = 0; i < agents.getNumGeometries(); ++i) {
			//	Geometry geo = agents.getGeometryN(i);
				
				
				s.setInt(1, agents.getFactory().getSRID());
				s.setObject(2, new PGgeometry(agents.toText()));
				
				int rows = s.executeUpdate();
	 
				if (rows > 0) {
					out.println("Successful insert");
				} else {
					out.println("Failed insert");
				}
			//}
			s.close();
		} catch (Exception e) {
			e.printStackTrace(out);
		}

		return agents;
	}
	
	/*
	@DescribeProcess(title = "savePosition", description = "Stores the agent position to the db")
	@DescribeResult(description = "push agents")
	public static Geometry savePosition(
			@DescribeParameter(name = "agentID", description = "The ID of the agent to store") int agentID,
			@DescribeParameter(name = "posNum", description = "The number of this position in the sequence") int posNum,
			@DescribeParameter(name = "geom", description = "The agent geometry at this position") Geometry geom) {

		if (geom == null || geom.getNumGeometries() == 0)
			throw new IllegalArgumentException("geom is null or zero in size");
		if (posNum < 0)
			throw new IllegalArgumentException("posNum is negative");
		
		try {
			PreparedStatement s = conn.prepareStatement("INSERT INTO agentpositions (agentid, posnum, srid, precision, geom) VALUES (?,?,?,?,?)");
			
			
				s.setInt(1, agentID);
				s.setInt(2, posNum);
				s.setInt(3, geom.getFactory().getSRID());
				s.setString(4, geom.getFactory().getPrecisionModel().getType().toString());
				s.setObject(5, new PGgeometry(geom.toText()));
				
				int rows = s.executeUpdate();
	 
				if (rows > 0) {
					out.println("Successful insert");
				} else {
					out.println("Failed insert");
				}
			s.close();
		} catch (Exception e) {
			e.printStackTrace(out);
		}

		return geom;
	}*/
	
	/*
	@DescribeProcess(title = "pushAgents", description = "Stores an array of agents to the db")
	@DescribeResult(description = "push agent")
	public static Geometry pushAgents(
			@DescribeParameter(name = "agentsArray", description = "An array of geometries") Geometry[] agentsArray) {

		if (agentsArray == null || agentsArray.length == 0)
			throw new IllegalArgumentException("geom is null or zero in size");
		
		try {
			PreparedStatement s = conn.prepareStatement("INSERT INTO agents (agentid, posnum, srid, precision, geom) VALUES (?,?,?,?,?)");
			
			
			s.setObject(1, new PGgeometry(agentsArray[0].toText()));
			s.setObject(2, new PGgeometry(agentsArray[1].toText()));
			s.setObject(3, new PGgeometry(agentsArray[2].toText()));
			s.setObject(4, new PGgeometry(agentsArray[3].toText()));
			s.setObject(5, new PGgeometry(agentsArray[4].toText()));
				
			int rows = s.executeUpdate();
	 
			if (rows > 0) {
				out.println("Successful insert");
			} else {
				out.println("Failed insert");
			}
			s.close();
		} catch (Exception e) {
			e.printStackTrace(out);
		}

		return agentsArray[0];
	}*/
	
	/*
	@DescribeProcess(title = "popAgents", description = "Retrives all agent positions")
	@DescribeResult(description = "popped agents")
	public static Geometry popAgents(
			@DescribeParameter(name = "posNum", description = "Position number to retrieve") int posNum) {

		//if (target_areas == null || target_areas.getNumGeometries() == 0)
		//	throw new IllegalArgumentException("target_areas is null or zero in size");
		
		List output = new ArrayList();
		GeometryFactory f = null;
		
		try {
			
			//TODO here
			Statement qs = conn.createStatement();
			ResultSet r = qs.executeQuery("SELECT st_astext(agent1) as agent1,st_astext(agent2) as agent2,st_astext(agent3) as agent3,st_astext(agent4) as agent4,st_astext(agent5) as agent5, FROM agents;");
			
			//s.setInt(1, posNum);
			
			//ResultSet r = qs.executeQuery("SELECT srid,precision,st_astext(large_poly) as poly FROM save");
			
			
			while (r.next()) {
				if (r.getRow() == posNum){
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
			}
			
			qs.close();
		} catch (Exception e) {
			e.printStackTrace(out);
		}

		out.println("done");

		// The param is used to get the right factory
		return f.createGeometryCollection(GeometryFactory.toGeometryArray(output));
	}*/
	
	@DescribeProcess(title = "popPosition", description = "Pops a specific position of agents from the db")
	@DescribeResult(description = "popped geometry")
	public static GeometryCollection popPosition(
			@DescribeParameter(name = "posNum", description = "The position number") int posNum) {

		if (posNum <= 0)
			throw new IllegalArgumentException("posNum is not positive - numbers start at 1");
		
		List output = new ArrayList();
		GeometryFactory f = null;

		try {
			Statement qs = conn.createStatement();
			ResultSet r = qs.executeQuery("SELECT srid,st_astext(agents) as poly FROM agentsave");
			
			while (r.next()) {
				if (r.getRow() == posNum){
					if (f == null) {
						int srid = r.getInt(1);
						
						f = new GeometryFactory(new PrecisionModel(), srid);
					}
					String wkt = (String)r.getObject(2);
					out.println(wkt);
					out.println(r.getObject(2));
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
			@DescribeParameter(name = "agents", description = "Agent geometries") GeometryCollection agents) {

		if (agents == null || agents.getNumGeometries() == 0)
			throw new IllegalArgumentException("agents is null or zero in size");
		
		List output = new ArrayList();
		GeometryFactory f = null;

		try {
			Statement qs = conn.createStatement();
			ResultSet r = qs.executeQuery("SELECT srid,st_astext(agents) as poly FROM agentsave");
			
			while (r.next()) {
				if (f == null) {
					int srid = r.getInt(1);
					
					f = new GeometryFactory(new PrecisionModel(), srid);
				}
				String wkt = (String)r.getObject(2);
	
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

	/*
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
	}*/
	
	/*
	@DescribeProcess(title = "getNumPositions", description = "Returns the number of saved positions for the given agent")
	@DescribeResult(description = "The number of saved positions for the given agent")
	public static Integer getNumPositions(
			@DescribeParameter(name = "agentID", description = "The ID of the agent") int agentID) {

		// Initialise the count to 0
		int count = 0;

		try {
			//Statement qs = conn.createStatement();
			//ResultSet r = qs.executeQuery(
			PreparedStatement s = conn.prepareStatement("SELECT COUNT(posNum) FROM Orders WHERE agentID=?;");
			
			s.setInt(1, agentID);
			
			ResultSet r = s.executeQuery();
			
			// Retrieve the first element in the (only) column
			count = r.getInt(1);
			
			s.close();
			
			/*
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
			*/
	/*
		} catch (Exception e) {
			e.printStackTrace(out);
		}

		out.println("done");

		// Return the count of positions
		return count;
	}*/
}