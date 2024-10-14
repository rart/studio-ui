/*
 * Copyright (C) 2007-2024 Crafter Software Corporation. All Rights Reserved.
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

import { ElementType, lazy } from 'react';
import { UnknownControl } from './common/UnknownControl';

export const controlMap: Record<string, ElementType> = {
  'auto-filename': null,
  'aws-file-upload': null,
  'box-file-upload': null,
  'checkbox-group': null,
  checkbox: null,
  'date-time': null,
  disabled: null,
  dropdown: null,
  'file-name': lazy(() => import('./controls/Slug')),
  forcehttps: null, // TODO: probably not needed, getname returns `disabled`
  'image-picker': null, // Mapped to `image`
  image: lazy(() => import('./controls/ImagePicker')),
  input: null, // Mapped to `text`
  text: lazy(() => import('./controls/Text')),
  'internal-name': null,
  label: null,
  'link-input': null,
  'link-textarea': null,
  'linked-dropdown': null,
  'locale-selector': null,
  'node-selector': lazy(() => import('./controls/NodeSelector')),
  'numeric-input': null,
  'page-nav-order': null,
  rte: null,
  textarea: lazy(() => import('./controls/Textarea')),
  time: null,
  'transcoded-video-picker': null,
  uuid: null,
  'video-picker': null,
  __UNKNOWN__: UnknownControl
};
