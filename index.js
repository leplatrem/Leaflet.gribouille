(function () {
    var RESOLUTION = 16,  // Number of points per circle
        SIZE = 40;        // Pen size

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
            var drawn = multipolygon.getLayers().map(polygons2ringholes),
                dot = circle2polygon(e.latlng, radius, RESOLUTION),
                merged = mergePolygons(drawn, dot);
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

    function polygons2ringholes(polygon) {
        return polygon.getLatLngs().concat(polygon._holes);
    }

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
        var scale = 10000;

        var first_path = first.map(latlngs2ring);
            second_path = second.map(latlngs2ring);
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
        return polygonsholes.map(expolygon2latlngs);


        function expolygon2latlngs(expolygon) {
            var outer = expolygon.outer.map(point2latlng),
                holes = expolygon.holes.map(ring2latlngs);
            return ([outer]).concat(holes);
        }
        function point2latlng(p) {
            return [p.Y / scale, p.X / scale];
        }
        function latlng2point(latlng) {
            return {X: latlng.lng, Y: latlng.lat};
        }
        function ring2latlngs(r) {
            return r.map(point2latlng);
        }
        function latlngs2ring(ll) {
            return ll.map(latlng2point);
        }
    }
})();