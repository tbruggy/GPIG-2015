package org.example.wps.wps_demo;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import com.vividsolutions.jts.geom.Coordinate;
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

public class PolygonTools extends StaticMethodsProcessFactory<PolygonTools> {

  public PolygonTools() {
    super(Text.text("Polygon Tools"), "custom", PolygonTools.class);
  }

  static Geometry polygonize(Geometry geometry) {
      List lines = LineStringExtracter.getLines(geometry);
      Polygonizer polygonizer = new Polygonizer();
      polygonizer.add(lines);
      Collection polys = polygonizer.getPolygons();
      Polygon[] polyArray = GeometryFactory.toPolygonArray(polys);
      return geometry.getFactory().createGeometryCollection(polyArray);
  }
  
  public static Map sortByValue(Map unsortedMap) {
		Map sortedMap = new TreeMap(new ValueComparator(unsortedMap));
		sortedMap.putAll(unsortedMap);
		return sortedMap;
	}

  @DescribeProcess(title = "modifyPolygon", description = "Splits a polygon by a linestring")
  @DescribeResult(description = "Geometry collection created by splitting the input polygon")
  public static Geometry modifyPolygon(
      @DescribeParameter(name = "polygon", description = "Polygon to be unioned") Geometry poly,
      @DescribeParameter(name = "line", description = "Second geometry to union") Geometry line) {
      
	  //compute distance to target
      double distance 					= poly.distance(line);
      Coordinate[] coords 				=  poly.getCoordinates();
      List<Coordinate> temp_coord		= new ArrayList<Coordinate>();
      List<Polygon> out 				= new ArrayList<Polygon>(); 
      HashMap<Integer,Double> map		= new HashMap<Integer,Double>();
      
      for (int i = 0; i < coords.length; i++) {
    	  //save the coordinate and distance to target
    	  map.put(i, coords[i].distance(line.getCoordinate()));
      }
     
      //sort by distance
      Map sortedMap = sortByValue(map);
      
      //get 3 closest coordinates
      for(Object i : sortedMap.keySet()) {
    	  temp_coord.add(coords[(Integer)i]);
    	  if(temp_coord.size() == 3) break;
      }
      
      //convert to array
      Coordinate[] nc = temp_coord.toArray(new Coordinate[temp_coord.size()]);
      Polygon g =  poly.getFactory().createPolygon(nc);
      out.add(g);
      
      //create geometry and expand in the direction of target
      return poly.getFactory().buildGeometry(out).buffer(10,10);
  }
}

class ValueComparator implements Comparator {
	 
	Map map;
 
	public ValueComparator(Map map) {
		this.map = map;
	}
 
	public int compare(Object keyA, Object keyB) {
		Comparable valueA = (Comparable) map.get(keyA);
		Comparable valueB = (Comparable) map.get(keyB);
		return valueB.compareTo(valueA);
	}
}
