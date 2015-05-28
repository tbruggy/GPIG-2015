package org.gpigf.presentation.aoi;

import java.util.Collection;
import java.util.List;

import org.geotools.process.factory.DescribeParameter;
import org.geotools.process.factory.DescribeProcess;
import org.geotools.process.factory.DescribeResult;
import org.geotools.process.factory.StaticMethodsProcessFactory;
import org.geotools.text.Text;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.geom.PrecisionModel;
import com.vividsolutions.jts.geom.util.LineStringExtracter;
import com.vividsolutions.jts.operation.polygonize.Polygonizer;

public class AttractorDeterrents extends StaticMethodsProcessFactory<AttractorDeterrents> {

  public AttractorDeterrents() {
    super(Text.text("Polygon Tools"), "custom", AttractorDeterrents.class);
  }

  static Geometry polygonize(Geometry geometry) {
      List lines = LineStringExtracter.getLines(geometry);
      Polygonizer polygonizer = new Polygonizer();
      polygonizer.add(lines);
      Collection polys = polygonizer.getPolygons();
      Polygon[] polyArray = GeometryFactory.toPolygonArray(polys);
      return geometry.getFactory().createGeometryCollection(polyArray);
  }

  @DescribeProcess(title = "addAttractor", description = "Adds an attractor to the map")
  @DescribeResult(description = "Geometry collection created by creating a linestring to the attractor")
  public static Geometry addAttractor(
      @DescribeParameter(name = "polygon", description = "Polygon to be unioned2") Geometry poly,
      @DescribeParameter(name = "line", description = "Second geometry to union") Geometry point) {
      
	  Coordinate[] var = new Coordinate[2];
	  var[0] = poly.getCentroid().getCoordinate();
	  var[1] = point.getCentroid().getCoordinate();
	  
	  LineString l = new LineString(var,new PrecisionModel(),0);  
	  
	  return l.intersection(poly).buffer(poly.getLength()/50,10).difference(poly);
	  
//      return l.intersection(poly).buffer(poly.getLength()/50,10).union(poly);
  }
  
  @DescribeProcess(title = "addDeterrant", description = "Adds a deterrant to the map")
  @DescribeResult(description = "Geometry collection created by splitting the input polygon")
  public static Geometry addDeterrant(
      @DescribeParameter(name = "polygon", description = "Polygon to be unioned") Geometry poly,
      @DescribeParameter(name = "line", description = "Second geometry to union") Geometry deterrant) {
	  
	  Point p = new Point(deterrant.getCentroid().getCoordinate(),new PrecisionModel(),0);
      return poly.difference(p.buffer(poly.getLength()/50, 10));
  }
  
  @DescribeProcess(title = "growshape", description = "grows shape towards an attractor")
  @DescribeResult(description = "geometry collection created by splitting the input polygon")
  public static Geometry growShape(
		  @DescribeParameter(name = "shape", description = "shape to be grown") Geometry shape){
	  return shape.buffer(shape.getLength()/6, 5);
  }
  
}
