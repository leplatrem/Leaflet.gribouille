(function () {

    window.onload = function onload() {
        var map = L.map('map')
                   .fitWorld();
        L.tileLayer('http://tile.osm.org/{z}/{x}/{y}.png').addTo(map);

        map.dragging.disable();

        var polygon = L.polygon([]).addTo(map);

        var enabled = false;
        map.on('mousedown mouseup', function () { enabled = !enabled; });
        map.on('mousemove', function (e) {
            if (!enabled) return;
            var radius = map.layerPointToLatLng([0, 0]).lat -
                         map.layerPointToLatLng([10, 10]).lat;
            var dot = circle2polygon(e.latlng, radius, 32);
            polygon.setLatLngs(mergePolygons(dot.getLatLngs(),
                                             polygon.getLatLngs()));
        });


        setInterval(function () {
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
        return L.polygon(latlngs);
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
            var paths = [];
            for (var i=0; i<latlngs.length; i++) {
                var latlng = latlngs[i];
                paths.push({X: latlng.lng, Y: latlng.lat});
            }
            return [paths];
        }

        function path2LatLngs(path) {
            var latlngs = [];
            for(var i=0; i<path.length; i++) {
                for(var j=0; j<path[i].length; j++) {
                    latlngs.push([path[i][j].Y / scale, path[i][j].X / scale]);
                }
            }
            return latlngs;
        }
    }
})();