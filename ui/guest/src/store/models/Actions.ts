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

import { GuestStandardAction } from './GuestStandardAction';
import { SyntheticEvent } from 'react';
import { ElementRecord } from '../../models/InContextEditing';
import GuestReducer from './GuestReducer';
import {
  CONTENT_TREE_SWITCH_FIELD_INSTANCE,
  DESKTOP_ASSET_DRAG_ENDED,
  DESKTOP_ASSET_DRAG_STARTED,
  HIGHLIGHT_MODE_CHANGED
} from '../../constants';
import {
  assetDragEnded,
  assetDragStarted,
  clearContentTreeFieldSelected,
  clearHighlightedDropTargets,
  componentDragEnded,
  componentDragStarted,
  componentInstanceDragEnded,
  componentInstanceDragStarted,
  contentTreeFieldSelected,
  contentTypeDropTargetsRequest,
  desktopAssetUploadComplete,
  desktopAssetUploadProgress,
  desktopAssetUploadStarted,
  editModeChanged,
  hostCheckIn,
  trashed,
  updateRteConfig
} from '@craftercms/studio-ui/build_tsc/state/actions/preview.js';
import { Observable } from 'rxjs';
import { contentReady } from '../actions';

export type GuestActionTypes =
  // dom events
  | 'mouseover'
  | 'mouseleave'
  | 'dragstart'
  | 'dragover'
  | 'dragleave'
  | 'drop'
  | 'dragend'
  | 'click'
  | 'dblclick'
  // other
  | 'set_drop_position'
  | 'add_asset_types'
  | 'move_component'
  | 'insert_component'
  | 'insert_instance'
  | 'computed_dragend'
  | 'computed_dragover'
  | 'ice_zone_selected'
  | 'edit_component_inline'
  | 'exit_component_inline_edit'
  | 'set_edit_mode'
  | 'start_listening'
  | 'scrolling'
  | 'scrolling_stopped'
  | 'drop_zone_enter'
  | 'drop_zone_leave'
  | typeof componentDragStarted.type
  | typeof componentDragEnded.type
  | typeof componentInstanceDragStarted.type
  | typeof componentInstanceDragEnded.type
  | typeof DESKTOP_ASSET_DRAG_STARTED
  | typeof desktopAssetUploadStarted.type
  | typeof desktopAssetUploadProgress.type
  | typeof desktopAssetUploadComplete.type
  | typeof DESKTOP_ASSET_DRAG_ENDED
  | typeof assetDragStarted.type
  | typeof assetDragEnded.type
  | typeof trashed.type
  | typeof editModeChanged.type
  | typeof HIGHLIGHT_MODE_CHANGED
  | typeof clearHighlightedDropTargets.type
  | typeof contentTypeDropTargetsRequest.type
  | typeof hostCheckIn.type
  | typeof contentTreeFieldSelected.type
  | typeof clearContentTreeFieldSelected.type
  | typeof CONTENT_TREE_SWITCH_FIELD_INSTANCE
  | typeof updateRteConfig.type
  | 'document:dragover'
  | 'document:dragleave'
  | 'document:drop'
  | 'document:dragend'
  | typeof contentReady.type;

export type MouseEventAction = GuestStandardAction<{
  event: JQueryMouseEventObject | SyntheticEvent<Element, MouseEvent> | MouseEvent;
  record: ElementRecord;
}>;

export type WithRecordAction = GuestReducer<{
  record: ElementRecord;
}>;

export type MouseEventActionObservable = Observable<GuestStandardAction>;
