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

import { ofType } from 'redux-observable';
import { map, switchMap, withLatestFrom } from 'rxjs/operators';
import { CrafterCMSEpic } from '../store';
import {
  pathNavigatorTreeFetchPathChildren,
  pathNavigatorTreeFetchPathChildrenComplete,
  pathNavigatorTreeFetchPathChildrenFailed,
  pathNavigatorTreeFetchPathPage,
  pathNavigatorTreeFetchPathPageComplete,
  pathNavigatorTreeFetchPathPageFailed,
  pathNavigatorTreeFetchRootItemComplete,
  pathNavigatorTreeInit,
  pathNavigatorTreeSetKeyword
} from '../actions/pathNavigatorTree';
import { fetchChildrenByPath, fetchItemByPath } from '../../services/content';
import { pathNavigatorFetchPathFailed } from '../actions/pathNavigator';
import { catchAjaxError } from '../../utils/ajax';

export default [
  // region pathNavigatorTreeInit
  (action$, state$) =>
    action$.pipe(
      ofType(pathNavigatorTreeInit.type),
      withLatestFrom(state$),
      switchMap(([{ payload }, state]) => {
        const { id, path } = payload;
        // if(expanded) {
        // fetchItemByPath()
        //  fetchChildrenByPaths()
        // } else
        return fetchItemByPath(state.sites.active, path, { castAsDetailedItem: true }).pipe(
          map((item) => pathNavigatorTreeFetchRootItemComplete({ id, item })),
          catchAjaxError((error) => pathNavigatorFetchPathFailed({ error, id }))
        );
      })
    ),
  // endregion
  // region pathNavigatorFetchPathChildren
  (action$, state$) =>
    action$.pipe(
      ofType(pathNavigatorTreeFetchPathChildren.type),
      withLatestFrom(state$),
      switchMap(([{ payload }, state]) => {
        const { id, path, options } = payload;
        return fetchChildrenByPath(state.sites.active, path, {
          limit: state.pathNavigatorTree[id].limit,
          ...options
        }).pipe(
          map((children) => pathNavigatorTreeFetchPathChildrenComplete({ id, parentPath: path, children, options })),
          catchAjaxError((error) => pathNavigatorTreeFetchPathChildrenFailed({ error, id }))
        );
      })
    ),
  // endregion
  // region pathNavigatorTreeSetKeyword
  (action$, state$) =>
    action$.pipe(
      ofType(pathNavigatorTreeSetKeyword.type),
      withLatestFrom(state$),
      switchMap(([{ payload }, state]) => {
        const { id, path, keyword } = payload;
        return fetchChildrenByPath(state.sites.active, path, {
          limit: state.pathNavigatorTree[id].limit,
          keyword
        }).pipe(
          map((children) =>
            pathNavigatorTreeFetchPathChildrenComplete({ id, parentPath: path, children, options: { keyword } })
          ),
          catchAjaxError((error) => pathNavigatorTreeFetchPathChildrenFailed({ error, id }))
        );
      })
    ),
  // endregion
  // region pathNavigatorTreeSetKeyword
  (action$, state$) =>
    action$.pipe(
      ofType(pathNavigatorTreeFetchPathPage.type),
      withLatestFrom(state$),
      switchMap(([{ payload }, state]) => {
        const { id, path } = payload;
        const keyword = state.pathNavigatorTree[id].keywordByPath[path];
        const offset = state.pathNavigatorTree[id].childrenByParentPath[path].length;
        return fetchChildrenByPath(state.sites.active, path, {
          limit: state.pathNavigatorTree[id].limit,
          keyword: keyword,
          offset: state.pathNavigatorTree[id].childrenByParentPath[path].length
        }).pipe(
          map((children) =>
            pathNavigatorTreeFetchPathPageComplete({
              id,
              parentPath: path,
              children,
              options: { keyword, offset }
            })
          ),
          catchAjaxError((error) => pathNavigatorTreeFetchPathPageFailed({ error, id }))
        );
      })
    )
  // endregion
] as CrafterCMSEpic[];
