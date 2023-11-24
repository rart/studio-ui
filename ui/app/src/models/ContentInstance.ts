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

export type Primitives = string | number | boolean | null | undefined;

// prettier-ignore
export type PrimRecord = Record<
  string,
  | Primitives
  | Record<string, Primitives>
  | Record<string, Primitives>[]
>;

export type PropValue = Primitives | Primitives[] | PrimRecord | PrimRecord[];

export type PropValueMap = Record<string, PropValue>;

export interface ContentInstanceSystemProps {
  id: string;
  path: string | null;
  label: string; // Internal name
  dateCreated: string;
  dateModified: string;
  contentTypeId: string;
  sourceMap?: Record<string, string>; // { fieldId: path }
}

export interface ContentInstanceBase {
  craftercms: ContentInstanceSystemProps;
}

/*
 * `ContentInstance` would become a type alias instead of an interface, but it can still be extended
 * via `ContentInstanceSystemProps` and `ContentInstanceBase` which remain interfaces. Also, this would
 * enable typing your own instances with the known properties or continue to use the loose typed as today.
 */
type ContentInstance<T extends Record<string, any> = PropValueMap> = T & ContentInstanceBase;

/* Examples: */

// Should not compile as i & j are not serializable props that one would ever get from Crafter
const ci1: ContentInstance = {
  craftercms: {
    id: 'id',
    path: 'path',
    label: 'label',
    dateCreated: 'dateCreated',
    dateModified: 'dateModified',
    contentTypeId: 'contentTypeId',
    sourceMap: {
      fieldId: 'path'
    }
  },
  myfieldId: 'value',
  b: 1,
  c: true,
  d: ['a', 'b', 'c'],
  e: [{ a: 1 }, { b: 2 }, { c: 3 }],
  f: { a: 1, b: 2, c: 3 },
  g: null,
  h: undefined,
  i: Symbol('i'),
  j: () => {}
};

// Should compile
const ci2: ContentInstance = {
  craftercms: {
    id: 'id',
    path: 'path',
    label: 'label',
    dateCreated: 'dateCreated',
    dateModified: 'dateModified',
    contentTypeId: 'contentTypeId',
    sourceMap: {
      fieldId: 'path'
    }
  }
};

// Should not compile as the `craftercms` prop is missing
const ci3: ContentInstance = {
  hello: 'world'
};

// Should compile as the `c` prop is missing
const ci4: ContentInstance<Record<'b' | 'c', string>> = {
  b: 'world',
  craftercms: {
    id: 'id',
    path: 'path',
    label: 'label',
    dateCreated: 'dateCreated',
    dateModified: 'dateModified',
    contentTypeId: 'contentTypeId',
    sourceMap: {
      fieldId: 'path'
    }
  }
};

// Should not compile as the `b` prop is not a string
const ci5: ContentInstance<{ a: string; b: number }> = {
  a: 'hello',
  b: '2',
  craftercms: {
    id: 'id',
    path: 'path',
    label: 'label',
    dateCreated: 'dateCreated',
    dateModified: 'dateModified',
    contentTypeId: 'contentTypeId',
    sourceMap: {
      fieldId: 'path'
    }
  }
};

/* End of Examples */
//
//
//
//

// An InstanceRecord is a ContentInstance without ContentInstanceSystemProps
export type InstanceRecord = Record<string, string | number | boolean | any[]>;

export default ContentInstance;

/*
 * */
