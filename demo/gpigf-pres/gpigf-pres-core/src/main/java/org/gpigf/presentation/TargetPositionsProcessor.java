package org.gpigf.presentation;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.PrecisionModel;
import com.vividsolutions.jts.geom.util.LineStringExtracter;
import com.vividsolutions.jts.operation.polygonize.Polygonizer;
import com.vividsolutions.jts.precision.GeometryPrecisionReducer;
import com.vividsolutions.jts.simplify.DouglasPeuckerSimplifier;

import org.geotools.geometry.jts.JTS;
import org.geotools.process.factory.DescribeParameter;
import org.geotools.process.factory.DescribeProcess;
import org.geotools.process.factory.DescribeResult;
import org.geotools.process.factory.StaticMethodsProcessFactory;
import org.geotools.text.Text;

public class TargetPositionsProcessor extends StaticMethodsProcessFactory<TargetPositionsProcessor> {

	public TargetPositionsProcessor() {
		super(Text.text("Target Position Processor"), "gpigf", TargetPositionsProcessor.class);
	}

	// This service does nothing. It is just a construct to act as the end of the process chain
	@DescribeProcess(title = "processTargetPositions", description = "Updates the area of possible positions for a target")
	@DescribeResult(description = "New target area geometries")
	public static GeometryCollection processTargetPositions(
			@DescribeParameter(name = "target_areas", description = "Current possible target positions") GeometryCollection target_areas,
			@DescribeParameter(name = "precision", description = "Precision value to use on the final polygons") double precision) 
					throws IllegalArgumentException {

		// This is still important to avoid errors in the js when adding the geometries to layers
		if (target_areas == null || target_areas.getNumGeometries() == 0)
			throw new IllegalArgumentException("target_areas is null or zero in size");
		
		List output = new ArrayList();
		for (int i = 0; i < target_areas.getNumGeometries(); ++i) {
			Geometry target_area = target_areas.getGeometryN(i);
			Geometry modified_area = DouglasPeuckerSimplifier.simplify(target_area, precision);

			output.add(modified_area);
		}
		
		return target_areas.getGeometryN(0).getFactory().createGeometryCollection(GeometryFactory.toGeometryArray(output));
	}

	@DescribeProcess(title = "growTargetPositions", description = "Grows the polygons by a given amount")
	@DescribeResult(description = "New target area geometries with increased size")
	public static GeometryCollection growTargetPositions(
			@DescribeParameter(name = "target_areas", description = "Current possible target positions") GeometryCollection target_areas,
			@DescribeParameter(name = "growth_distance", description = "The maximum distance the area should grow by") double growth_distance,      
			@DescribeParameter(name = "growth_segments", description = "The number of segments to use when rounding corners, lower number means less points") int growth_segments) 
					throws IllegalArgumentException {

		if (target_areas == null || target_areas.getNumGeometries() == 0)
			throw new IllegalArgumentException("target_areas is null or zero in size");

		List output = new ArrayList();
		for (int i = 0; i < target_areas.getNumGeometries(); ++i) {
			Geometry target_area = target_areas.getGeometryN(i);
			Geometry modified_area = target_area.buffer(growth_distance, growth_segments);

			output.add(modified_area);
		}

		return target_areas.getGeometryN(0).getFactory().createGeometryCollection(GeometryFactory.toGeometryArray(output));
	}
}