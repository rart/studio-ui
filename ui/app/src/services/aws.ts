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

import { get, post } from '../utils/ajax';
import { pluck } from 'rxjs/operators';
import { toQueryString } from '../utils/object';
import { Observable } from 'rxjs';
import { AwsItem } from '../models/Aws';

export function s3List(siteId: string, profileId: string, path?: string, type?: string): Observable<AwsItem[]> {
  const qs = toQueryString({
    siteId,
    profileId,
    ...(path ? { path } : {}),
    ...(type ? { type } : {})
  });

  return get(`/studio/api/2/aws/s3/list${qs}`).pipe(pluck('response', 'items'));
}

// TODO: check for the other s3 upload service somewhere
// :Observable<true>
export function s3Upload(data: FormData) {
  return post(`/studio/api/2/aws/s3/upload.json`, data).pipe(pluck('response'));

  // .pipe(mapTo(true));
}

// writeS3ContentUri: '/api/2/aws/s3/upload.json',
//   videoTranscode: '/api/2/aws/mediaconvert/upload',
