Highcharts.setOptions({
    lang: {
        months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio"],
        shortMonths: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        weekdays: ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]
    }
});

var appController = (function() {
    var app = {
            map: new google.maps.Map(document.getElementById("map-content"), {
                center: new google.maps.LatLng(-33.436936630999635, -70.64826747099966),
                streetViewControl: false,
                mapTypeControl: false,
                overviewMapControl: false,
                panControl: false,
                zoom: 9,
                zoomControl: false,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            }),
            lastInfoWindow: null,
            markers: [],
            markerCluster: null
        },
        st = {
            openFilters: "#open-filter-content",
            closeFilters: "#close-filter-content",
            filter: "#filter",
            filtersContent: "#filters-content",
            filterFrom: "#filter-from",
            filterTo: "#filter-to",
            tableEmpresa: "#table-empresa tbody",
            tableComuna: "#table-comuna tbody",
            pointPanel: "#point-panel",
            pointDetail: "#point-detail",
            closePointDetail: "#close-point-detail"
        },
        dom = {},
        catchDom = function() {
            dom.filter = $(st.filter);
            dom.openFilters = $(st.openFilters);
            dom.closeFilters = $(st.closeFilters);
            dom.filtersContent = $(st.filtersContent);
            dom.filterFrom = $(st.filterFrom);
            dom.filterTo = $(st.filterTo);
            dom.tableEmpresa = $(st.tableEmpresa);
            dom.tableComuna = $(st.tableComuna);
            dom.pointPanel = $(st.pointPanel);
            dom.pointDetail = $(st.pointDetail);
            dom.closePointDetail = $(st.closePointDetail);
        },
        navigationControl = {
            showFilters: function() {
                dom.filtersContent.toggleClass("show-filters");
            },
            fillDataTable: function(dataEmpresa, dataComuna) {
                dom.tableEmpresa.html(Mustache.render(templates.collections.long_row.content, dataEmpresa));
                dom.tableComuna.html(Mustache.render(templates.collections.short_row.content, dataComuna));
            },
            showPointDetail: function(data) {
                dom.pointPanel.html(Mustache.render(templates.collections.point_panel.content, data));
                dom.pointDetail.addClass("show-point-detail");
            },
            hidePointDetail: function() {
                dom.pointDetail.removeClass("show-point-detail");
                app.lastInfoWindow.setAnimation(null);
            }
        },
        mapControl = {
            readAddress: function(response) {
                var count = response.length;
                for (var i = 0; i < count; i++)
                    mapControl.addMarkers(response[i]);

                app.markerCluster = new MarkerClusterer(app.map, app.markers);
            },
            addMarkers: function(address) {
                var marker = new google.maps.Marker({
                    map: app.map,
                    position: new google.maps.LatLng(address.LATITUD, address.LONGITUD)
                });

                google.maps.event.addListener(marker, "click", function() {
                    if (app.lastInfoWindow)
                        app.lastInfoWindow.setAnimation(null);

                    navigationControl.showPointDetail(address);

                    marker.setAnimation(google.maps.Animation.BOUNCE);
                    app.lastInfoWindow = marker;
                });

                app.markers.push(marker);
            },
            removeMarkers: function() {
                dom.pointDetail.removeClass("show-point-detail");
                for (var i = 0; i < app.markers.length; i++)
                    app.markers[i].setMap(null);

                app.markers.length = 0;
                app.markerCluster.clearMarkers();

                events.requestInformation();
            }
        },
        chartControl = {
            dataToUTC: function(data) {
                var dataArray = [],
                    dataLength = data.length;
                for (var i = 0; i < dataLength; i++) 
                    dataArray.push([
                            Date.UTC(data[i].ANIO, data[i].MES - 1, data[i].DIA, data[i].HORA),
                            data[i].CANTIDAD_RECLAMOS
                        ]);
                

                chartControl.createChart(dataArray);
            },
            createChart: function(serieArray) {
                $("#online-chart").highcharts({
                    chart: {
                        zoomType: "x"
                    },
                    title: {
                        text: "Cantidad de reclamos ingresados por hora",
                        align: "left",
                        style: {
                            fontSize: "14px",
                            fontFamily: "\"Open Sans\",\"Helvetica Neue\",Helvetica,Arial,sans-serif",
                            color: "#4f4e4e",
                            fontWeight: "700"
                        }
                    },
                    xAxis: {
                        type: "datetime"
                    },
                    yAxis: {
                        title: {
                            text: "Cantidad de reclamos"
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    credits: {
                        enabled: false
                    },
                    plotOptions: {
                        area: {
                            lineWidth: 1,
                            states: {
                                hover: {
                                    lineWidth: 1
                                }
                            },
                            threshold: null
                        }
                    },
                    series: [
                        {
                            type: "area",
                            name: "Reclamos Ingresados",
                            data: serieArray
                        }
                    ]
                });
            }
        },
        events = {
            getRequest: function(url) {
                return $.ajax({
                    url: url,
                    dataType: "json",
                    type: "POST",
                    data: JSON.stringify({
                        filterFrom: dom.filterFrom.val(),
                        filterTo: dom.filterTo.val()
                    }),
                    contentType: "application/json; charset=utf-8",
                    success: function(response) {},
                    error: function(xmlHttpRequest, textStatus) {
                        alert(textStatus);
                    }
                });
            },
            requestInformation: function() {
                $.when(events.getRequest("WebService.asmx/GetPuntosReclamos"),
                        events.getRequest("WebService.asmx/GetReclamosComunas"),
                        events.getRequest("WebService.asmx/GetReclamosEmpresas"),
                        events.getRequest("WebService.asmx/GetReclamosIngresados"))
                    .done(function(puntos, comunas, empresas, ingreso) {
                        navigationControl.fillDataTable(empresas[0], comunas[0]);

                        mapControl.readAddress(puntos[0].d);
                        chartControl.dataToUTC(ingreso[0].d);

                    });
            },
            createDatePicker: function() {
                var option = { dateFormat: "dd/mm/yy" };
                dom.filterFrom.datepicker(option);
                dom.filterTo.datepicker(option);
            }
        },
        suscribeEvents = function() {
            dom.openFilters.on("click", navigationControl.showFilters);
            dom.closeFilters.on("click", navigationControl.showFilters);
            dom.filter.on("click", mapControl.removeMarkers);
            dom.closePointDetail.on("click", navigationControl.hidePointDetail);

            events.requestInformation();
            events.createDatePicker();
        };

    catchDom();
    suscribeEvents();
})();