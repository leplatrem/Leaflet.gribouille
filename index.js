(function () {
    var RESOLUTION = 16,  // Number of points per circle
        SIZE = 10;        // Pen size

    window.onload = function onload() {
        var map = L.map('map')
                   .fitWorld();
        L.tileLayer('http://tile.osm.org/{z}/{x}/{y}.png').addTo(map);

        map.dragging.disable();

        var multipolygon = L.multiPolygon([], {weight: 1,
                                          fillOpacity: 0.5})
                       .addTo(map);

        var enabled = false,
            radius = 1;
        map.on('mousedown mouseup', function () { enabled = !enabled; });
        map.on('mousemove', function (e) {
            if (!enabled) return;
            var drawn = multipolygon.getLayers().map(function (polygon) {
                return polygon.getLatLngs().concat(polygon._holes);
            });
            var dot = circle2polygon(e.latlng, radius, RESOLUTION);
            // Merged multi-polygon
            var merged = mergePolygons(drawn, dot);
            multipolygon.setLatLngs(merged);
        });
        map.on('zoomend', function () {
            // Adjust pen size on zoom
            radius = map.layerPointToLatLng([0, 0]).lat -
                     map.layerPointToLatLng([0, SIZE/2]).lat;
        });

        setInterval(function () {
            // Render GeoJSON in text area
            document.getElementById('geojson')
                    .innerHTML = JSON.stringify(multipolygon.toGeoJSON());
        }, 500);
    };


    function circle2polygon(center, radius, points) {
        var latlngs = [];
        for (var i=0; i<points; i++) {
            var radians = (i / points) * 2.0 * Math.PI;
            var lat = center.lat + radius * Math.sin(radians),
                lng = center.lng + radius * Math.cos(radians);
            latlngs.push(L.latLng(lat, lng));
        }
        return [latlngs];
    }


    function mergePolygons(first, second) {
        var first_path = latLngs2Path(first),
            second_path = latLngs2Path(second);

        var scale = 10000;
        ClipperLib.JS.ScaleUpPaths(first_path, scale);
        ClipperLib.JS.ScaleUpPaths(second_path, scale);
        var cpr = new ClipperLib.Clipper();
        cpr.AddPaths(first_path, ClipperLib.PolyType.ptSubject, true);
        cpr.AddPaths(second_path, ClipperLib.PolyType.ptClip, true);
        var fillType = ClipperLib.PolyFillType.pftNonZero;
        var result = new ClipperLib.PolyTree();
        cpr.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
        var polygonsholes = new ClipperLib.ExPolygons();
        polygonsholes = ClipperLib.JS.PolyTreeToExPolygons(result, polygonsholes);
        return path2LatLngs(polygonsholes);

        function latLngs2Path(coords) {
            var paths = [];
            for (var i=0; i<coords.length; i++) {
                var poly = coords[i],
                    subpath = [];
                for (var j=0; j<poly.length; j++) {
                    var latlng = poly[j],
                        coord = {X: latlng.lng, Y: latlng.lat};
                    subpath.push(coord);
                }
                paths.push(subpath);
            }
            return paths;
        }
        function path2LatLngs(expolygons) {
            var multipolygons = [];
            for (var i=0; i<expolygons.length; i++) {
                var expolygon = expolygons[i];
                var outer = [];
                for (var j=0; j<expolygon.outer.length; j++) {
                    var latlng = expolygon.outer[j];
                    outer.push([latlng.Y / scale, latlng.X / scale]);
                }
                var holes = [];
                for (var j=0; j<expolygon.holes.length; j++) {
                    var hole = expolygon.holes[j];
                    holes[j] = [];
                    for (var k=0; k<hole.length; k++) {
                        var latlng = hole[k];
                        holes[j].push([latlng.Y / scale, latlng.X / scale]);
                    }
                }
                var polygon = ([outer]).concat(holes);
                multipolygons.push(polygon);
            }
            return multipolygons;
        }
    }
})();