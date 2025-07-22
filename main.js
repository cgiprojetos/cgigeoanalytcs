import { initializeMap } from './map.js';
import { createBaseLayers, createOverlayLayers } from './layers.js';
import { addLayerControl } from './controls.js';

// Variável global para armazenar a última coordenada clicada para o Street View
let ultimaCoordenadaClicada = null;

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. INICIALIZAÇÃO DO MAPA E CAMADAS ---
    const map = initializeMap('map');
    const baseLayers = createBaseLayers();
    const overlayLayers = createOverlayLayers();

    // Adiciona a camada base padrão ao mapa
    baseLayers["OpenStreetMap"].addTo(map);

    // Adiciona todas as camadas de sobreposição ao mapa por padrão e anexa o evento de clique
    Object.values(overlayLayers).forEach(grupo => {
        grupo.addTo(map);
        grupo.eachLayer(marker => {
            marker.on('click', function (e) {
                ultimaCoordenadaClicada = e.latlng;
            });
        });
    });

    // Pega as referências dos botões do HTML
    const resetButton = document.getElementById('resete-mapa');
    const dateFilterButton = document.getElementById('date-filter-btn');


   

    /**
     * @param {string} nomeMunicipio - O nome do local retornado pela busca.
     */
    function filtrarCamadasPorMunicipio(nomeMunicipio) {
        const municipioFiltrar = nomeMunicipio.split(',')[0].trim();
        let pontosVisiveis = 0;

        Object.values(overlayLayers).forEach(grupo => {
            grupo.eachLayer(layer => {
                const localizacaoDoPonto = layer.feature.properties.localizacao.split(',')[0].trim();
                if (localizacaoDoPonto.toLowerCase() === municipioFiltrar.toLowerCase()) {
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

    /**
     * Filtra as camadas JÁ VISÍVEIS no mapa com base em um intervalo de datas.
     */
    function filtrarCamadasPorData() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        if (!startDate || !endDate) {
            alert("Por favor, selecione uma data de início e uma data de fim.");
            return;
        }

        let pontosVisiveis = 0;
        Object.values(overlayLayers).forEach(grupo => {
            grupo.eachLayer(layer => {
                if (layer.feature && layer.feature.properties && layer.feature.properties.data) {
                    const dataDoPonto = layer.feature.properties.data;

                    if (map.hasLayer(layer)) {
                        if (dataDoPonto >= startDate && dataDoPonto <= endDate) {
                            pontosVisiveis++;
                        } else {
                            layer.removeFrom(map);
                        }
                    }
                }
            });
        });

        if (resetButton) {
            resetButton.style.display = 'block';
        }
        alert(`Filtro de data aplicado. Exibindo ${pontosVisiveis} pontos.`);
    }

    /**
     * Restaura todas as camadas ao mapa e limpa os filtros.
     */
    function resetarFiltro() {
        Object.values(overlayLayers).forEach(grupo => {
            grupo.eachLayer(layer => {
                layer.addTo(map);
            });
        });
        
        if (resetButton) {
            resetButton.style.display = 'none';
        }
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
    }

    // --- 3. EVENT LISTENERS PARA OS BOTÕES ---

    // Evento do botão de reset
    if (resetButton) {
        resetButton.addEventListener('click', resetarFiltro);
    }
    
    // Evento do botão de filtro de data
    if (dateFilterButton) {
        dateFilterButton.addEventListener('click', filtrarCamadasPorData);
    }
    
    // --- 4. CONTROLES DO MAPA ---

    // Adiciona o controle de camadas
    addLayerControl(map, baseLayers, overlayLayers);

    // Adiciona o controle de busca (Geocoder)
    L.Control.geocoder({
        position: 'topright',
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

    // Adiciona o botão customizado de Street View
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
                    alert("Clique em um ponto no mapa primeiro.");
                    return;
                }
                const lat = ultimaCoordenadaClicada.lat;
                const lng = ultimaCoordenadaClicada.lng;
                // URL padrão e funcional para o Street View
                const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
                window.open(url, '_blank');
            };
            return btn;
        },
        onRemove: function () {}
    });

    // Função para facilitar a criação do controle
    L.control.streetViewButton = function (opts) {
        return new L.Control.StreetViewButton(opts);
    };

    // Adiciona o controle ao mapa
    L.control.streetViewButton({ position: 'topleft' }).addTo(map);

});