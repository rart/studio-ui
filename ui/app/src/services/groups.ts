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

import PaginationOptions from '../models/PaginationOptions';
import { PagedArray } from '../models/PagedArray';
import { Observable } from 'rxjs';
import { toQueryString } from '../utils/object';
import { get } from '../utils/ajax';
import { map } from 'rxjs/operators';
import Group from '../models/Group';

const paginationDefault = {
  limit: 100,
  offset: 0
};

export function fetchAll(options?: PaginationOptions): Observable<PagedArray<Group>> {
  const qs = toQueryString({
    ...paginationDefault,
    ...options
  });
  return get(`/studio/api/2/groups${qs}`).pipe(
    map(({ response }) =>
      Object.assign(response.groups, {
        limit: response.limit,
        offset: response.offset,
        total: response.total
      })
    )
  );
}

export function fetchUsersFromGroup(id: number, options?: PaginationOptions): Observable<any> {
  // TODO: response type
  const qs = toQueryString({
    ...paginationDefault,
    options
  });
  return get(`/studio/api/2/groups/${id}/members${qs}`).pipe(
    map(({ response }) => {
      return response;
    })
  );
}
