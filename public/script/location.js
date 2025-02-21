document.addEventListener("DOMContentLoaded", function () {
    const cityDropdown = document.getElementById("cityDropdown");
    const providersContainer = document.getElementById("providersContainer");
    const servicesContainer = document.getElementById("servicesContainer");

    function fetchCityFromGeolocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                
                const response = await fetch("/api/get-city", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ latitude, longitude }),
                });
                
                const data = await response.json();
                const userCity = data.city;
                
                cityDropdown.value = userCity;
                updateProviders(userCity);
                updateServices(userCity);
            }, () => {
                console.log("Геолокация отклонена.");
            });
        }
    }

    function updateProviders(city) {
        fetch(`/providers/api?city=${city}`)
            .then(response => response.json())
            .then(providers => {
                providersContainer.innerHTML = providers.length > 0 
                    ? providers.map(provider => `
                        <div class="grid-item">
                            <p><a href="${provider.owner_link}">${provider.owner_name}</a></p>
                            <p>${provider.owner_about ? provider.owner_about : 'Нету описания'}</p>
                            <p>${provider.owner_contact && provider.owner_contact !== 'None' ? provider.owner_contact : 'Контактов нет'}</p>


                            
                        </div>
                    `).join('')
                    : '<p>Нет провайдеров в этом городе</p>';
            })
            .catch(error => console.error("Ошибка загрузки провайдеров:", error));
    }

    function updateServices(city) {
        fetch(`/services/api?city=${city}`)
            .then(response => response.json())
            .then(services => {
                servicesContainer.innerHTML = services.length > 0 
                    ? services.map(service => `
                        <div class="grid-item">
                           <a href="${service.link}"><img src="${service.img && !service.img.startsWith('/app/static/media') ? service.img : 'https://static-00.iconduck.com/assets.00/no-image-icon-512x512-lfoanl0w.png'}"  width="100" height="100"> </a>

                           
                            <p>${service.desc}</p>
                            <p>${service.loc}</p>
                            <p>${service.pub_date}</p>
                        </div>
                    `).join('')
                    : '<p>Нет сервисов в этом городе</p>';
            })
            .catch(error => console.error("Ошибка загрузки сервисов:", error));
    }

    cityDropdown.addEventListener("change", function () {
        const selectedCity = cityDropdown.value;
        updateProviders(selectedCity);
        updateServices(selectedCity);
    });

    fetchCityFromGeolocation();
});
