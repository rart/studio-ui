/*
 * Copyright (C) 2007-2022 Crafter Software Corporation. All Rights Reserved.
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

import { DialogStackItem, GlobalState } from '../../models/GlobalState';
import { createAction, createReducer } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

export const pushDialog = /*#__PURE__*/ createAction<Partial<DialogStackItem> & Pick<DialogStackItem, 'component'>>(
  'PUSH_DIALOG'
);
export const popDialog = /*#__PURE__*/ createAction<{ id: string }>('POP_DIALOG');
export const updateDialogState = /*#__PURE__*/ createAction<{ id: string; state: unknown }>('UPDATE_DIALOG_STATE');

const reducer = createReducer<GlobalState['dialogStack']>(
  {
    ids: [],
    byId: {}
  },
  (builder) => {
    builder.addCase(pushDialog, (state, { payload }) => {
      const id = payload.id ?? nanoid();
      state.ids.push(id);
      state.byId[id] = {
        id,
        ...payload,
        props: {
          open: true,
          isMinimized: false,
          isFullScreen: false,
          hasPendingChanges: false,
          isSubmitting: false,
          ...(payload.props as object)
        }
      };
    });
    builder.addCase(popDialog, (state, { payload }) => {
      state.ids = state.ids.filter((id) => payload.id !== id);
      delete state.byId[payload.id];
    });
    builder.addCase(updateDialogState, (state, { payload }) => {
      state.byId[payload.id].props = {
        // @ts-expect-error: TypeScript doesn't think the WritableDraft can be spread.
        ...state.byId[payload.id].props,
        // @ts-expect-error: Don't know how to type this all around. Type is too dynamic.
        ...payload.state
      };
    });
  }
);

export default reducer;
