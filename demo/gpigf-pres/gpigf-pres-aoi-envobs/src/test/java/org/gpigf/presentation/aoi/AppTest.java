package org.gpigf.presentation.aoi;

import java.util.ArrayList;

import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryCollection;
import com.vividsolutions.jts.geom.GeometryFactory;

/**
 * Unit test for simple App.
 */
public class AppTest 
    extends TestCase
{
    /**
     * Create the test case
     *
     * @param testName name of the test case
     */
    public AppTest( String testName )
    {
        super( testName );
    }

    /**
     * @return the suite of tests being tested
     */
    public static Test suite()
    {
        return new TestSuite( AppTest.class );
    }

    /**
     * Rigourous Test :-)
     */
    public void testProcessEnvObstacles()
    {
    	Coordinate[] coordinates = new Coordinate[] { 
    			new Coordinate(0, 0), 
    			new Coordinate(0, 10), 
    			new Coordinate(10, 10), 
    			new Coordinate(10,0), 
    			new Coordinate(0,0) 
    	};
    	
		ArrayList<Geometry> geometryList = new ArrayList<Geometry>();
		geometryList.add(new GeometryFactory().createPolygon(coordinates));
		GeometryCollection area = new GeometryFactory().createGeometryCollection(GeometryFactory.toGeometryArray(geometryList));
		
        EnvObstacles.processEnvObstacles(area, 0, 0, 0, 0);
    }
    
    public void testsaveEnvObstacles()
    {
    	Coordinate[] coordinates = new Coordinate[] { 
    			new Coordinate(0, 0), 
    			new Coordinate(0, 10), 
    			new Coordinate(10, 10), 
    			new Coordinate(10,0), 
    			new Coordinate(0,0) 
    	};
    	
		ArrayList<Geometry> geometryList = new ArrayList<Geometry>();
		geometryList.add(new GeometryFactory().createPolygon(coordinates));
		GeometryCollection area = new GeometryFactory().createGeometryCollection(GeometryFactory.toGeometryArray(geometryList));
		
        EnvObstacles.saveEnvObstacles(area);
    }
}
