/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { get } from '../utils/ajax';
import { toQueryString } from '../utils/object';
import { pluck } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CMISItem } from '../models/CMIS';

export function list(
  siteId: string,
  cmisRepoId: string,
  path?: string,
  offset?: number,
  limit?: number
): Observable<CMISItem[]> {
  const qs = toQueryString({
    siteId,
    cmisRepoId,
    ...(path ? { path } : {}),
    ...(offset ? { offset } : {}),
    ...(limit ? { limit } : {})
  });

  return get(`/studio/api/2/cmis/list${qs}`).pipe(pluck('response', 'items'));
}

export function search(
  siteId: string,
  cmisRepoId: string,
  searchTerm: string,
  path?: string,
  offset?: number,
  limit?: number
): Observable<CMISItem[]> {
  const qs = toQueryString({
    siteId,
    cmisRepoId,
    searchTerm,
    ...(path ? { path } : {}),
    ...(offset ? { offset } : {}),
    ...(limit ? { limit } : {})
  });

  return get(`/studio/api/2/cmis/search${qs}`).pipe(pluck('response', 'items'));
}
