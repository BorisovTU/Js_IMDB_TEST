const headerTitle = document.getElementById('headerTitle');

async function fetchMovies(category, searchWord) {
    try {
        let url;
        if (searchWord && searchWord.trim() !== '') {
            const query = encodeURIComponent(searchWord.trim());
            url = `${baseUrl}search/${category}?query=${query}&language=sv-SE`;
        } else {
            url = `${baseUrl}movie/${category}?language=sv-SE`;
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('404');
            }
            throw new Error('Nätverksfel');
        }

        const data = await response.json();
        const movies = data.results;
        const container = document.querySelector('.container .row');

        if (container) {
            container.innerHTML = '';
        }

        if (!movies || movies.length === 0) {
            updateMainHeading('');
            if (container) {
                if (category === 'person') {
                    container.innerHTML = '<div class="col-12"><p class="text-muted fs-5">Inga skådespelare hittades</p></div>';
                } else {
                    container.innerHTML = '<div class="col-12"><p class="text-muted fs-5">Inga filmer hittades</p></div>';
                }
            }
            return;
        }

        const limit = Math.min(movies.length, 10);
        for (let i = 0; i < limit; i++) {
            const card = document.createElement('div');
            card.className = 'col-sm-6 col-md-4 col-lg-4';

            if (category === 'person') {
                const profilePath = movies[i].profile_path
                    ? `https://image.tmdb.org/t/p/w500${movies[i].profile_path}`
                    : './images/default.profile.jpg';

                let knownForHTML = '';
                if (movies[i].known_for && movies[i].known_for.length > 0) {
                    const topKnown = movies[i].known_for.slice(0, 4);
                    knownForHTML = `
                        <div class="mt-3">
                            <h6 class="mb-2">🎬 Kända roller:</h6>
                            <ul class="list-unstyled mb-0" style="font-size: 0.85rem;">
                                ${topKnown.map(item => {
                        const title = item.title || item.name || 'Okänd titel';
                        const date = item.release_date || item.first_air_date || '';
                        const year = date ? date.substring(0, 4) : '?';
                        return `<li class="text-truncate" title="${title}">• ${title} <small class="text-muted">(${year})</small></li>`;
                    }).join('')}
                            </ul>
                            ${movies[i].known_for.length > 4
                        ? `<small class="text-muted d-block mt-1">+ ytterligare ${movies[i].known_for.length - 4} titlar</small>`
                        : ''}
                        </div>
                    `;
                } else {
                    knownForHTML = '<small class="text-muted mt-2 d-block">Ingen filmografi tillgänglig</small>';
                }

                card.innerHTML = `
                    <div class="card mb-3" style="width: 100%;">
                        <img class="card-img-top" src="${profilePath}" 
                             style="width:100%;height:400px;object-fit:cover;" 
                             alt="${movies[i].name}">
                        <div class="card-body">
                            <h5 class="card-title">${movies[i].name}</h5>
                            <p class="card-text text-muted">${movies[i].known_for_department || ''}</p>
                            ${knownForHTML}
                        </div>
                    </div>
                `;

            }
            else {
                const backdropPath = movies[i].backdrop_path || movies[i].poster_path
                    ? `https://image.tmdb.org/t/p/w500${movies[i].backdrop_path || movies[i].poster_path}`
                    : './images/default.jpg';

                const year = movies[i].release_date ? movies[i].release_date.substring(0, 4) : '';
                const titleWithYear = year ? `${movies[i].title} (${year})` : movies[i].title;

                card.innerHTML = `
                    <div class="card mb-3" style="width: 100%;">
                        <img class="card-img-top" src="${backdropPath}" 
                             style="width:100%;height:200px;object-fit:cover;" 
                             alt="${movies[i].title}">
                        <div class="card-body">
                            <h5 class="card-title">${titleWithYear}</h5>
                            <p class="card-text text-truncate">${movies[i].overview || ''}</p>
                            <a href="#" data-movie-id="${movies[i].id}" class="btn btn-primary">Titta</a>
                        </div>
                    </div>
                `;

                const tittaButton = card.querySelector('.btn-primary');
                tittaButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const movieId = movies[i].id;

                    try {
                        const videoResponse = await fetch(`${baseUrl}movie/${movieId}/videos?language=sv-SE`, options);
                        const videoData = await videoResponse.json();

                        if (videoData.results && videoData.results.length > 0) {
                            const videoKey = videoData.results[0].key;
                            const modalBody = document.querySelector('.modal-body');
                            modalBody.innerHTML = `
                                <div class="ratio ratio-16x9">
                                    <iframe src="https://www.youtube.com/embed/${videoKey}" 
                                            frameborder="0" 
                                            allowfullscreen>
                                    </iframe>
                                </div>
                            `;
                            const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
                            videoModal.show();
                        } else {
                            alert('Ingen trailer tillgänglig för denna film.');
                        }
                    } catch (error) {
                        console.error('Fel vid hämtning av trailer:', error);
                        alert('Kunde inte ladda trailern.');
                    }
                });
            }

            if (container) {
                container.appendChild(card);
            }
        }

    } catch (error) {
        console.error('Fel i fetchMovies:', error);
        const container = document.querySelector('.container .row');
        if (container) {
            container.innerHTML = '<div class="col-12"><p class="text-danger">Ett fel uppstod vid hämtning av data.</p></div>';
        }
    }
}

function updateMainHeading(text) {
    if (headerTitle) {
        headerTitle.innerText = text;
    }
}

document.getElementById("topMovies")?.addEventListener("click", (event) => {
    event.preventDefault();
    fetchMovies('top_rated', '');
    updateMainHeading('Topp tio filmer');
});

document.getElementById("popularMovies")?.addEventListener("click", (event) => {
    event.preventDefault();
    fetchMovies('popular', '');
    updateMainHeading('Mest populära filmer');
});

document.getElementById('searchForm')?.addEventListener('submit', function (event) {
    event.preventDefault();
    const selectedValue = document.querySelector('input[name="radio-button"]:checked')?.value;
    const searchInput = document.getElementById('input')?.value || '';
    fetchMovies(selectedValue, searchInput);
    updateMainHeading(selectedValue === 'person' ? 'Skådespelare' : 'Filmer');
});
