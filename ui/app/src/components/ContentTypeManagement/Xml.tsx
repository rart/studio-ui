/*
 * Copyright (C) 2007-2025 Crafter Software Corporation. All Rights Reserved.
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

import XmlDeserializer from '../XmlTools/XmlDeserializer';
import React from 'react';
import { DeserializerNullSymbol } from './utils';

export function Xml() {
	return (
		<XmlDeserializer
			deserializedObjectProcessor={(o) => {
				// @ts-expect-error: `configuration` not in unknown is handled.
				let config = o?.widget?.configuration ?? {};
				if (typeof config !== 'object') config = {};
				['baseSystemFieldOverrides', 'baseControlPropertyOverrides', 'baseControlConstraintOverrides'].forEach(
					(key) => {
						config[key] = typeof config[key] !== 'object' ? {} : config[key];
					}
				);
				return config;
			}}
			parserOptions={{
				parseAttributeValue: true,
				attributeValueProcessor(_, attrValue) {
					if (attrValue === 'null' || attrValue === 'undefined') return DeserializerNullSymbol;
					return attrValue;
				},
				tagValueProcessor(_, tagValue) {
					if (tagValue === 'null' || tagValue === 'undefined') return DeserializerNullSymbol;
					// Return original value for parser to parse.
					return tagValue;
					// Return undefined to keep the original value (i.e. no parsing, e.g. for boolean & number values)
					// return;
				},
				isArray(tagName: string, jPath: string) {
					return (
						jPath.endsWith('sections.fields') ||
						['controlExclusions', 'dataSourceExclusions', 'controls', 'sections'].includes(tagName)
					);
				}
			}}
		/>
	);
}

export default Xml;
