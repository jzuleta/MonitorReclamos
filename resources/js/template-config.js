var templates = (function() {
    var dataPath = "resources/templates/",
        sourceParameters = {
            long_row: {
                name: "long-data-row.html",
                content: ""
            },
            short_row: {
                name: "short-data-row.html",
                content: ""
            },
            point_panel: {
                name: "point-detail.html",
                content: ""
            }
        },
        initialize = {
            readTemplates: function() {
                $.each(sourceParameters, function(index, value) {
                    $.ajax({
                        url: dataPath + value.name,
                        async: false,
                        success: function(json) {
                            value.content = json;
                        }
                    });
                });
            }
        };
    initialize.readTemplates();

    return {
        collections: sourceParameters
    };
})();
