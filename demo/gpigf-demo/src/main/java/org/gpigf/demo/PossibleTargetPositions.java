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

public class PossibleTargetPositions extends StaticMethodsProcessFactory<PossibleTargetPositions> {

  public PossibleTargetPositions() {
    super(Text.text("Possible Target Positions"), "gpigf", PossibleTargetPositions.class);
  }

  @DescribeProcess(title = "processTargetPositions", description = "Calculates the new area of possible target positions")
  @DescribeResult(description = "Modified Possible Target Poisitions")
  public static Geometry processTargetPositions(
      @DescribeParameter(name = "current_area", description = "Current possible target positions") Geometry current_area,
      @DescribeParameter(name = "growth_distance", description = "The maximum distance the area should grow by") double growth_distance,      
      @DescribeParameter(name = "growth_segments", description = "The number of segments to use when rounding corners, lower number means less points") int growth_segments) {

	  Geometry modified_area = current_area.buffer(growth_distance, growth_segments);
	  
      return modified_area.getFactory().createGeometry(modified_area);
  }
}