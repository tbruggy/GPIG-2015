package org.gpigf.presentation.aoi;

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

public class AttractorPoint extends StaticMethodsProcessFactory<AttractorPoint> {

	public AttractorPoint() {
		super(Text.text("Attractor Point"), "gpigf", AttractorPoint.class);
	}

	@DescribeProcess(title = "processAttractorPoint", description = "Calculates new size of target areas based upon points of attraction")
	@DescribeResult(description = "Modified target areas")
	public static GeometryCollection processAttractorPoint(
			@DescribeParameter(name = "target_areas", description = "Target area polygon") GeometryCollection target_areas,
			@DescribeParameter(name = "attractor_point", description = "Point of attractor") Geometry attractor_point,
			@DescribeParameter(name = "attractor_radius", description = "Radius of attractor") double attractor_radius,
			@DescribeParameter(name = "attractor_scale", description = "Scale of attraction") double attractor_scale) {

		if (target_areas == null || target_areas.getNumGeometries() == 0)
			throw new IllegalArgumentException("target_areas is null or zero in size");
		
		List output = new ArrayList();

		for (int i = 0; i < target_areas.getNumGeometries(); ++i) {
			Geometry modified_area = target_areas.getGeometryN(i);
			// TODO do geometric calculation

			output.add(modified_area);
		}

		return attractor_point.getFactory().createGeometryCollection(GeometryFactory.toGeometryArray(output));
	}
}