(function () {
    var RESOLUTION = 16,  // Number of points per circle
        SIZE = 10;        // Pen size

    window.onload = function onload() {
        var map = L.map('map')
                   .fitWorld();
        L.tileLayer('http://tile.osm.org/{z}/{x}/{y}.png').addTo(map);

        map.dragging.disable();

        var polygon = L.multiPolygon([], {weight: 1,
                                          fillOpacity: 0.5})
                       .addTo(map);

        var enabled = false,
            radius = 1;
        map.on('mousedown mouseup', function () { enabled = !enabled; });
        map.on('mousemove', function (e) {
            if (!enabled) return;
            var dot = circle2polygon(e.latlng, radius, RESOLUTION);
            // Merged multi-polygon
            polygon .setLatLngs(mergePolygons([dot.getLatLngs()],
                                              polygon.getLatLngs()));
        });
        map.on('zoomend', function () {
            // Adjust pen size on zoom
            radius = map.layerPointToLatLng([0, 0]).lat -
                     map.layerPointToLatLng([0, SIZE]).lat;
        });

        setInterval(function () {
            // Render GeoJSON in text area
            document.getElementById('geojson')
                    .innerHTML = JSON.stringify(polygon.toGeoJSON());
        }, 500);
    };


    function circle2polygon(center, radius, points) {
        var latlngs = [];
        for (var i=0; i<points; i++) {
            var radians = (i / points) * 2.0 * Math.PI;
            var lat = center.lat + radius * Math.sin(radians),
                lng = center.lng + radius * Math.cos(radians);
            latlngs.push([lat, lng]);
        }
        return L.polygon([latlngs]);
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
        var result = new ClipperLib.Paths();
        cpr.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
        return path2LatLngs(result);

        function latLngs2Path(latlngs) {
            return convert(latlngs, true);
        }
        function path2LatLngs(path) {
            return convert(path, false);
        }
        function convert(coords, from) {
            var paths = [];
            for (var i=0; i<coords.length; i++) {
                var poly = coords[i],
                    subpath = [];
                for (var j=0; j<poly.length; j++) {
                    var latlng = poly[j],
                        coord = from ? {X: latlng.lng, Y: latlng.lat} :
                                       [latlng.Y / scale, latlng.X / scale];
                    subpath.push(coord);
                }
                paths.push(subpath);
            }
            return paths;
        }
    }
})();