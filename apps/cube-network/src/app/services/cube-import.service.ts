import { HttpClient, type HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, forkJoin, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import type { CardColor, CubeCard } from '../models/cube.model';

type ScryfallCard = {
  id: string;
  name: string;
  type_line: string;
  colors: string[];
  cmc: number;
  image_uris?: { normal: string };
  card_faces?: { image_uris?: { normal: string } }[];
};

type ScryfallCollectionResponse = {
  data: ScryfallCard[];
  not_found: { name: string }[];
};

@Injectable({ providedIn: 'root' })
export class CubeImportService {
  private http = inject(HttpClient);

  importFromCubeId(cubeId: string): Observable<CubeCard[]> {
    return this.http
      .get(`https://cubecobra.com/cube/api/cubelist/${cubeId}`, {
        responseType: 'text',
      })
      .pipe(
        map((text) =>
          text
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean),
        ),
        switchMap((names) => this.enrichWithScryfall(names)),
        catchError((err: HttpErrorResponse) =>
          throwError(
            () =>
              new Error(
                err.status === 0
                  ? 'Could not reach Cube Cobra (possible CORS restriction). Try the manual import instead.'
                  : `Cube Cobra error: ${err.statusText}`,
              ),
          ),
        ),
      );
  }

  importFromCardNames(rawList: string): Observable<CubeCard[]> {
    const names = rawList
      .split('\n')
      .map((l) => l.replace(/^\d+[xX]\s*/, '').trim())
      .filter(Boolean);

    return this.enrichWithScryfall(names);
  }

  private enrichWithScryfall(cardNames: string[]): Observable<CubeCard[]> {
    const unique = [...new Set(cardNames)];
    const batches = chunk(unique, 75);

    const requests = batches.map((batch) =>
      this.http.post<ScryfallCollectionResponse>('https://api.scryfall.com/cards/collection', {
        identifiers: batch.map((name) => ({ name })),
      }),
    );

    return forkJoin(requests).pipe(
      map((responses) =>
        responses.flatMap((res) =>
          res.data.map(
            (card): CubeCard => ({
              id: card.id,
              name: card.name,
              type: card.type_line,
              colors: card.colors as CardColor[],
              cmc: card.cmc,
              imageUrl: card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal,
            }),
          ),
        ),
      ),
    );
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}
