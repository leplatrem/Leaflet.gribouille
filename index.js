(function () {

    window.onload = function onload() {
        var map = L.map('map')
                   .fitWorld();
        L.tileLayer('http://tile.osm.org/{z}/{x}/{y}.png').addTo(map);


        map.on('mousemove', function (e) {
            L.circle(e.latlng, 200).addTo(map);
        });
    };
})();