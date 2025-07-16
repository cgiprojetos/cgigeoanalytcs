import { initializeMap } from './map.js';
import { createBaseLayers, createOverlayLayers } from './layers.js';
import { addLayerControl } from './controls.js';

let ultimaCoordenadaClicada = null;

document.addEventListener('DOMContentLoaded', () => {

    const map = initializeMap('map');
    const baseLayers = createBaseLayers();
    const overlayLayers = createOverlayLayers(); // Objeto com as camadas de pontos.

    // Adiciona a camada base padrão ao mapa.
    baseLayers["OpenStreetMap"].addTo(map);

    // Adiciona TODAS as camadas de sobreposição ao mapa por padrão.
    Object.values(overlayLayers).forEach(grupo => {
        grupo.addTo(map);

        // Aqui adiciono o evento para salvar a coordenada clicada em cada marcador
        grupo.eachLayer(marker => {
            marker.on('click', function (e) {
                ultimaCoordenadaClicada = e.latlng;
            });
        });
    });

    // Pega a referência do botão de reset que você adicionou ao HTML.
    const resetButton = document.getElementById('resete-mapa');

    // LÓGICA DE FILTRAGEM E RESET 
    function filtrarCamadasPorMunicipio(nomeMunicipio) {
        const municipioFiltrar = nomeMunicipio.split(',')[0].trim();
        let pontosVisiveis = 0;

        Object.values(overlayLayers).forEach(grupo => {
            grupo.eachLayer(layer => {
                const localizacaoDoPonto = layer.feature.properties.localizacao.split(',')[0].trim();
                if (localizacaoDoPonto === municipioFiltrar) {
                    layer.addTo(map);
                    pontosVisiveis++;
                } else {
                    layer.removeFrom(map);
                }
            });
        });

        if (resetButton) {
            resetButton.style.display = 'block';
        }
        alert(`Exibindo ${pontosVisiveis} pontos para ${municipioFiltrar}.`);
    }

    function resetarFiltro() {
        Object.values(overlayLayers).forEach(grupo => {
            grupo.eachLayer(layer => {
                layer.addTo(map);
            });
        });

        if (resetButton) {
            resetButton.style.display = 'none';
        }
    }

    // Evento do botão reset
    if (resetButton) {
        resetButton.addEventListener('click', resetarFiltro);
    }

    addLayerControl(map, baseLayers, overlayLayers);

    L.Control.geocoder({
        placeholder: 'Buscar município...',
        errorMessage: 'Local não encontrado.',
        geocoder: L.Control.Geocoder.nominatim({
            geocodingQueryParams: { "countrycodes": "br", "viewbox": "-46.6,-18.3,-37.3,-2.8" }
        }),
        defaultMarkGeocode: false
    })
    .on('markgeocode', function(e) {
        map.fitBounds(e.geocode.bbox);
        filtrarCamadasPorMunicipio(e.geocode.name);
    })
    .addTo(map);

    // Botão customizado Street View adaptado para abrir no último ponto clicado, sem custos do google.
    L.Control.StreetViewButton = L.Control.extend({
        onAdd: function (map) {
            const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
            btn.innerHTML = '📷';
            btn.title = 'Abrir Google Street View no último ponto clicado';
            btn.style.backgroundColor = 'white';
            btn.style.width = '34px';
            btn.style.height = '34px';
            btn.style.cursor = 'pointer';

            btn.onclick = function () {
                if (!ultimaCoordenadaClicada) {
                    alert("Clique em um ponto primeiro.");
                    return;
                }
                const lat = ultimaCoordenadaClicada.lat.toFixed(6);
                const lng = ultimaCoordenadaClicada.lng.toFixed(6);
                const url = `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}`;
                window.open(url, '_blank');
            };

            return btn;
        },

        onRemove: function () {}
    });

    L.control.streetViewButton = function (opts) {
        return new L.Control.StreetViewButton(opts);
    };

    L.control.streetViewButton({ position: 'topleft' }).addTo(map);

});
