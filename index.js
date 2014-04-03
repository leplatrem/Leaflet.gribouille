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

        var worker = new Worker('union.js');
        worker.addEventListener('message', function(e) {
          polygon.setLatLngs(JSON.parse(e.data));
        }, false);

        var enabled = false,
            radius = 1;
        map.on('mousedown mouseup', function () { enabled = !enabled; });
        map.on('mousemove', function (e) {
            if (!enabled) return;
            var dot = circle2polygon(e.latlng, radius, RESOLUTION);
            // Merged multi-polygon
            var params = JSON.stringify({first: [dot.getLatLngs()],
                                         second: polygon.getLatLngs()});
            worker.postMessage(params);
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
})();