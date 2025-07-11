
import { initializeMap } from './map.js';
import { createBaseLayers, createOverlayLayers } from './layers.js';
import { addLayerControl } from './controls.js';

document.addEventListener('DOMContentLoaded', () => {

    const map = initializeMap('map');
    const baseLayers = createBaseLayers();
    const overlayLayers = createOverlayLayers(); // Objeto com as camadas de pontos.

    // Adiciona a camada base padrão ao mapa.
    baseLayers["OpenStreetMap"].addTo(map);

    // Adiciona TODAS as camadas de sobreposição ao mapa por padrão.
    Object.values(overlayLayers).forEach(layer => layer.addTo(map));

    // Pega a referência do botão de reset que você adicionou ao HTML.
    const resetButton = document.getElementById('resete-mapa');


    //  LÓGICA DE FILTRAGEM E RESET 

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

    // Adiciona o evento de clique para o botão de reset.
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
});