package org.gpigf.presentation;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.util.LineStringExtracter;
import com.vividsolutions.jts.operation.polygonize.Polygonizer;

import org.geotools.process.factory.DescribeParameter;
import org.geotools.process.factory.DescribeProcess;
import org.geotools.process.factory.DescribeResult;
import org.geotools.process.factory.StaticMethodsProcessFactory;
import org.geotools.text.Text;

public class AgentProcessor extends StaticMethodsProcessFactory<AgentProcessor> {

	public AgentProcessor() {
		super(Text.text("Agent Tracker"), "gpigf", AgentProcessor.class);
	}

	@DescribeProcess(title = "processAgentPath", description = "Subtracts an agents path from a target area")
	@DescribeResult(description = "Modified target areas")
	public static GeometryCollection processAgentPath(
			@DescribeParameter(name = "target_areas", description = "Target area polygon") GeometryCollection target_areas,
			@DescribeParameter(name = "agent_path", description = "Line path of agent") Geometry agent_path,
			@DescribeParameter(name = "agent_vision", description = "Radius of agents vision") int agent_vision) 
					throws IllegalArgumentException {
		
		if (target_areas == null || target_areas.getNumGeometries() == 0)
			throw new IllegalArgumentException("target_areas is null or zero in size");
		
		Geometry visioned_path = agent_path.buffer((double)agent_vision);
		List output = new ArrayList();

		for (int i = 0; i < target_areas.getNumGeometries(); ++i) {
			Geometry target_area = target_areas.getGeometryN(i);
			Geometry modified_area = target_area.difference(visioned_path);

			output.add(modified_area);
		}

		return agent_path.getFactory().createGeometryCollection(GeometryFactory.toGeometryArray(output));
	}
}