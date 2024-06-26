var map, geojson, featureOverlay, overlays, style;
var selected, features, layer_name, layerControl;
var content;
var selectedFeature;


var view = new ol.View({
    projection: 'EPSG:4326',
    center: [80.6, 7.30],
    zoom: 8,

});
var view_ov = new ol.View({
    projection: 'EPSG:4326',
    center: [80.6, 7.30],
    zoom: 9,
});


var base_maps = new ol.layer.Group({
    'title': 'Base maps',
    layers: [
        new ol.layer.Tile({
            title: 'Satellite',
            type: 'base',
            visible: true,
            source: new ol.source.XYZ({
                attributions: ['Powered by Esri',
                    'Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
                ],
                attributionsCollapsible: false,
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                maxZoom: 23
            })
        }),
        new ol.layer.Tile({
            title: 'OSM',
            type: 'base',
            visible: true,
            source: new ol.source.OSM()
        })


    ]
});

var OSM = new ol.layer.Tile({
    source: new ol.source.OSM(),
    type: 'base',
    title: 'OSM',
});

overlays = new ol.layer.Group({
    'title': 'Overlays',
    layers: []
});


map = new ol.Map({
    target: 'map',
    view: view,

});


map.addLayer(base_maps);
map.addLayer(overlays);
var popup = new Popup();
map.addOverlay(popup);

var mouse_position = new ol.control.MousePosition();
map.addControl(mouse_position);
var slider = new ol.control.ZoomSlider();
map.addControl(slider);



var zoom_ex = new ol.control.ZoomToExtent({
    extent: [
        65.90, 5.48, 98.96, 40.30
    ]
});
map.addControl(zoom_ex);

var scale_line = new ol.control.ScaleLine({
    units: 'metric',
    bar: true,
    steps: 6,
    text: true,
    minWidth: 140,
    target: 'scale_bar'
});
map.addControl(scale_line);

layerSwitcher = new ol.control.LayerSwitcher({
    activationMode: 'click',
    startActive: true,
    tipLabel: 'Layers', // Optional label for button
    groupSelectStyle: 'children', // Can be 'children' [default], 'group' or 'none'
    collapseTipLabel: 'Collapse layers',
});
map.addControl(layerSwitcher);

layerSwitcher.renderPanel();

var geocoder = new Geocoder('nominatim', {
    provider: 'osm',
    lang: 'en',
    placeholder: 'Search for ...',
    limit: 5,
    debug: false,
    autoComplete: true,
    keepOpen: true
});
map.addControl(geocoder);

geocoder.on('addresschosen', function(evt) {
    //console.info(evt);
    if (popup) {
        popup.hide();
    }
    window.setTimeout(function() {
        popup.show(evt.coordinate, evt.address.formatted);
    }, 3000);
});

//custom Scale

function scale() {
    var resolution = map.getView().get('resolution');

    var units = map.getView().getProjection().getUnits();

    var dpi = 25.4 / 0.28;
    var mpu = ol.proj.Units.METERS_PER_UNIT[units];
    //alert(resolution);
    var scale = resolution * mpu * 39.37 * dpi;
    //alert(scale);
    if (scale >= 9500 && scale <= 950000) {
        scale = Math.round(scale / 1000) + "K";
    } else if (scale >= 950000) {
        scale = Math.round(scale / 1000000) + "M";
    } else {
        scale = Math.round(scale);
    }
    document.getElementById('scale_bar1').innerHTML = "Scale = 1 : " + scale;
}
scale();

map.getView().on('change:resolution', scale);


//legend
function legend() {

    $('#legend').empty();
    var no_layers = overlays.getLayers().get('length');


    var head = document.createElement("h8");

    var txt = document.createTextNode("Legend");

    head.appendChild(txt);
    var element = document.getElementById("legend");
    element.appendChild(head);


    overlays.getLayers().getArray().slice().forEach(layer => {

        var head = document.createElement("p");

        var txt = document.createTextNode(layer.get('title'));
        //alert(txt[i]);
        head.appendChild(txt);
        var element = document.getElementById("legend");
        element.appendChild(head);
        var img = new Image();
        img.src = "http://localhost:8080/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=" + layer.get('title');
        var src = document.getElementById("legend");
        src.appendChild(img);

    });



}

legend();


// highlight the feature on map and table on map click
function highlight(evt) {

    if (selectedFeature) {
        selectedFeature.setStyle();
        selectedFeature = undefined;
    }

    var feature = map.forEachFeatureAtPixel(evt.pixel,
        function(feature, layer) {
            return feature;
        });

    if (feature && feature.getId() != undefined) {


        var geometry = feature.getGeometry();
        var coord = geometry.getCoordinates();
        var coordinate = evt.coordinate;
    

        $(function() {
            $("#table td").each(function() {
                $(this).parent("tr").css("background-color", "white");
            });
        });
        feature.setStyle(highlightStyle);
        selectedFeature = feature;
        var table = document.getElementById('table');
        var cells = table.getElementsByTagName('td');
        var rows = document.getElementById("table").rows;
        var heads = table.getElementsByTagName('th');
        var col_no;
        for (var i = 0; i < heads.length; i++) {
            // Take each cell
            var head = heads[i];
            //alert(head.innerHTML);
            if (head.innerHTML == 'id') {
                col_no = i + 1;
                //alert(col_no);
            }

        }
        var row_no = findRowNumber(col_no, feature.getId());
        //alert(row_no);

        var rows = document.querySelectorAll('#table tr');

        rows[row_no].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        $(document).ready(function() {
            $("#table td:nth-child(" + col_no + ")").each(function() {

                if ($(this).text() == feature.getId()) {
                    $(this).parent("tr").css("background-color", "grey");

                }
            });
        });
    } else {
        $(function() {
            $("#table td").each(function() {
                $(this).parent("tr").css("background-color", "white");
            });
        });

    }

};

//list of wms_layers_ in window on click of button

function wms_layers() {

    $(function() {

        $("#wms_layers_window").modal({
            backdrop: false
        });
        $("#wms_layers_window").draggable();
        $("#wms_layers_window").modal('show');

    });

    $(document).ready(function() {
        $.ajax({
            type: "GET",
            url: "http://localhost:8080/geoserver/wms?request=getCapabilities",
            dataType: "xml",
            success: function(xml) {
                $('#table_wms_layers').empty();
                // console.log("here");
                $('<tr></tr>').html('<th>Name</th><th>Title</th><th>Abstract</th>').appendTo('#table_wms_layers');
                $(xml).find('Layer').find('Layer').each(function() {
                    var name = $(this).children('Name').text();
                  
                    var title = $(this).children('Title').text();

                    var abst = $(this).children('Abstract').text();
                    //   alert(abst);


                    //   alert('test');
                    $('<tr></tr>').html('<td>' + name + '</td><td>' + title + '</td><td>' + abst + '</td>').appendTo('#table_wms_layers');
                    //document.getElementById("table_wms_layers").setAttribute("class", "table-success");

                });
                addRowHandlers1();
            }
        });
    });




    function addRowHandlers1() {
        //alert('knd');
        var rows = document.getElementById("table_wms_layers").rows;
        var table = document.getElementById('table_wms_layers');
        var heads = table.getElementsByTagName('th');
        var col_no;
        for (var i = 0; i < heads.length; i++) {
            // Take each cell
            var head = heads[i];
            //alert(head.innerHTML);
            if (head.innerHTML == 'Name') {
                col_no = i + 1;
                //alert(col_no);
            }

        }
        for (i = 0; i < rows.length; i++) {

            rows[i].onclick = function() {
                return function() {

                    $(function() {
                        $("#table_wms_layers td").each(function() {
                            $(this).parent("tr").css("background-color", "white");
                        });
                    });
                    var cell = this.cells[col_no - 1];
                    layer_name = cell.innerHTML;
                    // alert(layer_name);

                    $(document).ready(function() {
                        $("#table_wms_layers td:nth-child(" + col_no + ")").each(function() {
                            if ($(this).text() == layer_name) {
                                $(this).parent("tr").css("background-color", "grey");



                            }
                        });
                    });

                    //alert("id:" + id);
                };
            }(rows[i]);
        }

    }

}
// add wms layer to map on click of button
function add_layer() {
    //	alert("jd"); 

    // alert(layer_name);
    //map.removeControl(layerSwitcher);

    var name = layer_name.split(":");
    //alert(layer_name);
    var layer_wms = new ol.layer.Image({
        title: layer_name,
        // extent: [-180, -90, -180, 90],
        source: new ol.source.ImageWMS({
            url: 'http://localhost:8080/geoserver/wms',
            params: {
                'LAYERS': layer_name
            },
            ratio: 1,
            serverType: 'geoserver'
        })
    });
    overlays.getLayers().push(layer_wms);

    var url = 'http://localhost:8080/geoserver/wms?request=getCapabilities';
    var parser = new ol.format.WMSCapabilities();


    $.ajax(url).then(function(response) {
        //window.alert("word");
        var result = parser.read(response);
        // console.log(result);
        // window.alert(result);
        var Layers = result.Capability.Layer.Layer;
        var extent;
        for (var i = 0, len = Layers.length; i < len; i++) {

            var layerobj = Layers[i];
            //  window.alert(layerobj.Name);

            if (layerobj.Name == layer_name) {
                extent = layerobj.BoundingBox[0].extent;
                //alert(extent);
                map.getView().fit(
                    extent, {
                        duration: 1590,
                        size: map.getSize()
                    }
                );

            }
        }
    });


    layerSwitcher.renderPanel();
    legend();

}

function close_wms_window() {
    layer_name = undefined;
}
// function on click of getinfo
function info() {
    if (document.getElementById("info_btn").innerHTML == " Activate GetInfo") {

        document.getElementById("info_btn").innerHTML = " De-Activate GetInfo";
        document.getElementById("info_btn").setAttribute("class", "btn btn-danger btn-sm");
        map.on('singleclick', getinfo);
    } else {

        map.un('singleclick', getinfo);
        document.getElementById("info_btn").innerHTML = " Activate GetInfo";
        document.getElementById("info_btn").setAttribute("class", "btn btn-success btn-sm");
        if (popup) {
            popup.hide();
        }
    }
}

// getinfo function
function getinfo(evt) {

    var coordinate = evt.coordinate;
    var viewResolution = /** @type {number} */ (view.getResolution());


    if (popup) {
        popup.hide();
    }
    if (content) {
        content = '';
    }
    overlays.getLayers().getArray().slice().forEach(layer => {
        var visibility = layer.getVisible();
        console.log(visibility);
        if (visibility == true) {

            var layer_title = layer.get('title');
            var wmsSource = new ol.source.ImageWMS({
                url: 'http://localhost:8080/geoserver/wms',
                params: {
                    'LAYERS': layer_title
                },
                serverType: 'geoserver',
                crossOrigin: 'anonymous'
            });

            var url = wmsSource.getFeatureInfoUrl(
                evt.coordinate, viewResolution, 'EPSG:4326', {
                    'INFO_FORMAT': 'text/html'
                });
            // alert(url[i]);
            //console.log(url);

            //assuming you use jquery
            $.get(url, function(data) {

                // $("#popup-content").append(data);
                //document.getElementById('popup-content').innerHTML = '<p>Feature Info</p><code>' + data + '</code>';
                content += data;
                // overlay.setPosition(coordinate);
                popup.show(evt.coordinate, content);


            });
        }

    });

}



// clear function
function clear_all() {
    if (vector1) {
        vector1.getSource().clear();
        //map.removeLayer(geojson);
    }

    if (draw1) {
        map.removeInteraction(draw1);
    }
    document.getElementById('map').style.height = '100%';
    document.getElementById('table_data').style.height = '0%';
    map.updateSize();
    $('#table').empty();
    $('#legend').empty();
    if (geojson) {
        geojson.getSource().clear();
        map.removeLayer(geojson);
    }

    if (selectedFeature) {
        selectedFeature.setStyle();
        selectedFeature = undefined;
    }
    if (popup) {
        popup.hide();
    }
    map.getView().fit([78.00, 5.7, 82.96, 10.00], {
        duration: 1590,
        size: map.getSize()
    });




    document.getElementById("legend_btn").innerHTML = " Show Legend";
    document.getElementById("legend").style.width = "0%";
    document.getElementById("legend").style.visibility = "hidden";
    document.getElementById('legend').style.height = '0%';

    map.un('singleclick', getinfo);
    map.un('singleclick', highlight);
    document.getElementById("info_btn").innerHTML = " Activate GetInfo";
    document.getElementById("info_btn").setAttribute("class", "btn btn-success btn-sm");
    map.updateSize();



    overlays.getLayers().getArray().slice().forEach(layer => {

        overlays.getLayers().remove(layer);

    });

    layerSwitcher.renderPanel();

    if (draw) {
        map.removeInteraction(draw)
    };
    if (vectorLayer) {
        vectorLayer.getSource().clear();
    }
    map.removeOverlay(helpTooltip);

    if (measureTooltipElement) {
        var elem = document.getElementsByClassName("tooltip tooltip-static");
        //$('#measure_tool').empty(); 

        //alert(elem.length);
        for (var i = elem.length - 1; i >= 0; i--) {

            elem[i].remove();
            //alert(elem[i].innerHTML);
        }
    }



}




function show_hide_legend() {

    if (document.getElementById("legend").style.visibility == "hidden") {

        document.getElementById("legend_btn").innerHTML = " Hide Legend";
		document.getElementById("legend_btn").setAttribute("class", "btn btn-danger btn-sm");

        document.getElementById("legend").style.visibility = "visible";
        document.getElementById("legend").style.width = "15%";

        document.getElementById('legend').style.height = '38%';
        map.updateSize();
    } else {
	    document.getElementById("legend_btn").setAttribute("class", "btn btn-success btn-sm");
        document.getElementById("legend_btn").innerHTML = " Show Legend";
        document.getElementById("legend").style.width = "0%";
        document.getElementById("legend").style.visibility = "hidden";
        document.getElementById('legend').style.height = '0%';

        map.updateSize();
    }
}



draw_type.onchange = function() {

    map.removeInteraction(draw1);

    if (draw) {
        map.removeInteraction(draw);
        map.removeOverlay(helpTooltip);
        map.removeOverlay(measureTooltip);
    }
    if (vectorLayer) {
        vectorLayer.getSource().clear();
    }
    if (vector1) {
        vector1.getSource().clear();
		// $('#table').empty();
    }
	

    if (measureTooltipElement) {
        var elem = document.getElementsByClassName("tooltip tooltip-static");
        //$('#measure_tool').empty(); 

        //alert(elem.length);
        for (var i = elem.length - 1; i >= 0; i--) {

            elem[i].remove();
            //alert(elem[i].innerHTML);
        }
    }

    add_draw_Interaction();
};


var source1 = new ol.source.Vector({
    wrapX: false
});

var vector1 = new ol.layer.Vector({
    source: source1
});
map.addLayer(vector1);

var draw1;



/**
 * Currently drawn feature.
 * @type {module:ol/Feature~Feature}
 */
var sketch;




