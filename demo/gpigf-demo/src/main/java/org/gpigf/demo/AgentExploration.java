package org.gpigf.demo;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.util.LineStringExtracter;
import com.vividsolutions.jts.operation.polygonize.Polygonizer;

import org.geotools.process.factory.DescribeParameter;
import org.geotools.process.factory.DescribeProcess;
import org.geotools.process.factory.DescribeResult;
import org.geotools.process.factory.StaticMethodsProcessFactory;
import org.geotools.text.Text;

public class AgentExploration extends StaticMethodsProcessFactory<AgentExploration> {

  public AgentExploration() {
    super(Text.text("Agent Exploration"), "gpigf", AgentExploration.class);
  }

  @DescribeProcess(title = "processAgentPath", description = "Subtracts an agents path from a target area")
  @DescribeResult(description = "Modified target area")
  public static Geometry processAgentPath(
      @DescribeParameter(name = "target_area", description = "Target area polygon") Geometry target_area,
      @DescribeParameter(name = "agent_path", description = "Line path of agent") Geometry agent_path,
      @DescribeParameter(name = "agent_vision", description = "Radius of agents vision") int agent_vision) {

	  Geometry visioned_path = agent_path.buffer((double)agent_vision);
	  Geometry modified_area = target_area.difference(visioned_path);
	  
      return modified_area.getFactory().createGeometry(modified_area);
  }
}