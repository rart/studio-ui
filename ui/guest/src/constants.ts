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

// region Accommodation Actions

export const HIGHLIGHT_MODE_CHANGED = 'HIGHLIGHT_MODE_CHANGED';
export const CONTENT_TYPES_REQUEST = 'CONTENT_TYPES_REQUEST';
export const GUEST_MODELS_RECEIVED = 'GUEST_MODELS_RECEIVED';
export const DESKTOP_ASSET_DRAG_STARTED = 'DESKTOP_ASSET_DRAG_STARTED';
export const DESKTOP_ASSET_DRAG_ENDED = 'DESKTOP_ASSET_DRAG_ENDED';
export const CHILDREN_MAP_UPDATE = 'CHILDREN_MAP_UPDATE';
export const CONTENT_TREE_SWITCH_FIELD_INSTANCE = 'CONTENT_TREE_SWITCH_FIELD_INSTANCE';

// endregion

export enum EditingStatus {
  LISTENING = 'LISTENING',
  SORTING_COMPONENT = 'SORTING_COMPONENT',
  PLACING_NEW_COMPONENT = 'PLACING_NEW_COMPONENT',
  PLACING_DETACHED_COMPONENT = 'PLACING_DETACHED_COMPONENT',
  PLACING_DETACHED_ASSET = 'PLACING_DETACHED_ASSET',
  EDITING_COMPONENT = 'EDITING_COMPONENT',
  EDITING_COMPONENT_INLINE = 'EDITING_COMPONENT_INLINE',
  UPLOAD_ASSET_FROM_DESKTOP = 'UPLOAD_ASSET_FROM_DESKTOP',
  SHOW_DROP_TARGETS = 'SHOW_DROP_TARGETS',
  SELECT_FIELD = 'SELECT_FIELD',
  HIGHLIGHT_MOVE_TARGETS = 'HIGHLIGHT_MOVE_TARGETS'
}

export enum HighlightMode {
  ALL = 'all',
  MOVE_TARGETS = 'move'
}
