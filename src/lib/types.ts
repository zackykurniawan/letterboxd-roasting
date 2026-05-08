export interface FilmEntry {
  title: string;
  year: number;
  rating: number;
  poster?: string;
}

export interface ReviewEntry {
  title: string;
  year: number;
  rating: number;
  review: string;
  poster: string;
}

export interface LetterboxdData {
  username: string;
  display_name: string;
  bio: string;
  total_films: number;
  avg_rating: number;
  top_genres: string[];
  favorite_decade: string;
  recent_films: FilmEntry[];
  favorite_films: FilmEntry[];
  highest_rated_films: FilmEntry[];
  lowest_rated_films: FilmEntry[];
  recent_reviews: ReviewEntry[];
  popular_reviews: ReviewEntry[];
}

export interface RoastResponse {
  roasting: string;
  userData: LetterboxdData;
}

export interface ApiError {
  error: string;
  code?: string;
}
