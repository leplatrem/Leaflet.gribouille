(function () {

    window.onload = function onload() {
        var map = L.map('map')
                   .fitWorld();
        L.tileLayer('http://tile.osm.org/{z}/{x}/{y}.png').addTo(map);


        map.on('mousemove', function (e) {
            var radius = map.layerPointToLatLng([0, 0]).lat -
                         map.layerPointToLatLng([5, 5]).lat;
            circle2polygon(e.latlng, radius, 32).addTo(map);
        });
    };


    function circle2polygon(center, radius, points) {
        var latlngs = [];
        for (var i=0; i<points; i++) {
            var radians = (i / points) * 2.0 * Math.PI;
            var lat = center.lat + radius * Math.sin(radians),
                lng = center.lng + radius * Math.cos(radians);
            latlngs.push([lat, lng]);
        }
        return L.polygon(latlngs, {fillOpacity: 1.0});
    }
})();