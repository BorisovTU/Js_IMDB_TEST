const headerTitle = document.getElementById('headerTitle');

async function fetchMovies(category, searchWord) {

  try{
    if(searchWord){
        response = await fetch(baseUrl +'search/'+category+"?query="+searchWord+"&", options);
    }else{
        response = await fetch(baseUrl +  "movie/"+category, options);
    }
    if(response.ok){
        let movies = await response.json();
        movies = movies.results;
        //displayFunction(movie);
        if(movies){
            // Assuming there is a container element to append the cards to
            const container = document.querySelector('.container .row');
            container.innerHTML = '';
            console.log(movies)
            // Iterate through the movies array
            for (let i = 0; i < 10; i++) {
                // Create a new card element
                const card = document.createElement('div');
                card.className = 'col-sm-6 col-md-4 col-lg-4';
                if(category === "person"){
                    if(!movies[i].profile_path){
                        movies[i].profile_path = "./images/default.profile.jpg";
                    } else {
                        movies[i].profile_path = `https://image.tmdb.org/t/p/w500${movies[i].profile_path}`;
                    }

                    // 🎬 Формируем список известных работ из known_for
                    let knownForHTML = '';
                    if(movies[i].known_for && movies[i].known_for.length > 0){
                        const topKnown = movies[i].known_for.slice(0, 4); // Берём первые 4 работы

                        knownForHTML = `
                        <div class="mt-3">
                        <h6 class="mb-2">🎬 Kända roller:</h6>
                        <ul class="list-unstyled mb-0" style="font-size: 0.85rem;">
                            ${topKnown.map(item => `
                                <li class="text-truncate" title="${item.title || item.name}">
                                    • ${item.title || item.name} 
                                    <small class="text-muted">
                                        (${(item.release_date || item.first_air_date || '?').substring(0,4)})
                                    </small>
                                </li>
                            `).join('')}
                        </ul>
                        ${movies[i].known_for.length > 4 ?
                        `<small class="text-muted d-block mt-1">+ ytterligare ${movies[i].known_for.length - 4} titlar</small>`
                        : ''}
                        </div>`;
                    } else {
                        knownForHTML = '<small class="text-muted mt-2 d-block">Ingen filmografi tillgänglig</small>';
                    }

                    // 🎨 Формируем карточку актёра с фильмографией
                    card.innerHTML = `
                      <div class="card mb-3" style="width: 100%;">
                          <img class="card-img-top" src="${movies[i].profile_path}" 
                               style="width:100%;height:400px;object-fit:cover;" 
                               alt="${movies[i].name}">
                          <div class="card-body">
                              <h5 class="card-title">${movies[i].name}</h5>
                              <p class="card-text text-muted">${movies[i].known_for_department || ''}</p>
                              ${knownForHTML}
                          </div>
                      </div>
                  `;

                    container.appendChild(card);
                }else{
                    if(!movies[i].backdrop_path){
                        movies[i].backdrop_path = "./images/default.jpg"
                    }else{
                        movies[i].backdrop_path = `https://image.tmdb.org/t/p/w500/${movies[i].backdrop_path}`
                    }
                    card.innerHTML = `
                    <div class="card" style="width: 100%; margin-bottom: 10px;margin-top: 10px;">
                    <img class="card-img-top" src="${movies[i].backdrop_path}" style="width:100%;hight:100%;" alt="${movies[i].name}">
                                <div class="card-body">
                                    <h5 class="card-title">${movies[i].title}</h5>
                                    <p class="card-text">${movies[i].overview}</p>
                                    <a href="#" key="${movies[i].id}" class="btn btn-primary">Titta</a>
                                </div>
                            </div>
                    `;
                    // Create a "Titta" button
                    const tittaButton = card.querySelector('.btn-primary');

                    // Add a click event listener to the existing "Titta" button
                    tittaButton.addEventListener('click', async () => {
                        console.log(movies[i].id)
                        // response = await fetch(baseUrl +  "movie/"+category, options);

                        const videoResponse = await fetch(`https://api.themoviedb.org/3/movie/${movies[i].id}/videos`, options);
                        const videoData = await videoResponse.json();

                        if (videoData.results.length > 0) {
                            const videoKey = videoData.results[0].key; // Assuming the first video in the list

                            // Dynamically set the video source in the modal
                            const modalBody = document.querySelector('.modal-body');
                            modalBody.innerHTML = `
                                <iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoKey}" frameborder="0" allowfullscreen></iframe>
                            `;

                            // Show the modal
                            const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
                            videoModal.show();
                        } else {
                            console.log('No videos available for this movie.');
                        }
                    });
                }



                // Append the card to the container
                container.appendChild(card);
            };
        }
        if (movies.length === 0) {
        const h1El = document.createElement('h1');
            updateMainHeading('')
            h1El.innerText = `Inga resultat funna. Kontrollera om din stavning är korrekt och försök igen!`;
            divContainer.append(h1El)

        }
     }

     else if(response.status === 404){
      throw 404;

     }

     else{
      throw 'error';
     }

    }
    catch(error){
        console.log(error);

    }

}

// Add click event listener to the anchor element
document.getElementById("topMovies").addEventListener("click", (event) => {
    // Prevent the default behavior of the anchor tag
    event.preventDefault();
    // fetching the top rated movie 
    fetchMovies('top_rated', "");
    headerTitle.innerText="Topp tio filmer"

});

document.getElementById("popularMovies").addEventListener("click", (event) => {
    // Prevent the default behavior of the anchor tag
    event.preventDefault();
    // fetching the popular movie 
    fetchMovies('popular', "");
    headerTitle.innerText="Mest populära filmer"

});
document.getElementById('searchForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const selectedValue = document.querySelector('input[name="radio-button"]:checked').value;
    const searchInput = document.getElementById('input').value;
    fetchMovies(selectedValue, searchInput);
    headerTitle.innerText=selectedValue

});

/**
 * Laddar och visar en förhandsvisning av skådespelarens filmografi
 * @param {number} personId - Skådespelarens ID från TMDB
 * @param {string} containerId - ID på elementet där resultatet ska visas
 */
async function loadActorFilmography(personId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        // Hämta filmografi från TMDB API
        const response = await fetch(
            `${baseUrl}person/${personId}/movie_credits?api_key=${API_KEY}&language=sv-SE`,
            options
        );

        if (!response.ok) throw new Error('Misslyckades hämta data');
        const data = await response.json();

        // Filtrera och sortera filmer - ta topp 5 mest populära med affisch
        const topMovies = data.cast
            .filter(m => m.poster_path && m.title)
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 5);

        // Hantera fallet där ingen filmografi hittas
        if (topMovies.length === 0) {
            container.innerHTML = '<small class="text-muted">Ingen filmografi hittades</small>';
            return;
        }

        // Bygg HTML för filmografi-listan
        const filmographyHTML = `
            <h6 class="mb-2">🎬 Kända roller:</h6>
            <ul class="list-unstyled mb-0" style="font-size: 0.9rem;">
                ${topMovies.map(movie => `
                    <li class="text-truncate" title="${movie.title}">
                        • ${movie.title} 
                        <small class="text-muted">(${movie.release_date?.substring(0,4) || '?'})</small>
                    </li>
                `).join('')}
            </ul>
            ${data.cast.length > 5 ?
            `<small class="text-muted d-block mt-1">+ ytterligare ${data.cast.length - 5} filmer</small>`
            : ''}
        `;

        container.innerHTML = filmographyHTML;

    } catch (error) {
        console.error(`Fel vid laddning av filmografi för ${personId}:`, error);
        container.innerHTML = '<small class="text-danger">Kunde inte ladda filmografi</small>';
    }
}