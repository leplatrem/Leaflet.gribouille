importScripts('vendor/clipper.js');

self.addEventListener('message', function(e) {
    var params = JSON.parse(e.data),
        result = mergePolygons(params.first, params.second);
    self.postMessage(JSON.stringify(result));

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
}, false);
