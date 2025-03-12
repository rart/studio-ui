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

import { ContentTypeField, ContentTypeSection, ValidationKeys } from '../../models';
import LookupTable from '../../models/LookupTable';
import ContentType from '../../models/ContentType';
import { foo } from '../../utils/object';
import { commonControlFieldsDescriptors } from './descriptors';

const contentTypeFieldToXmlNameMap = {
	name: 'title'
};

export function createTypeValuesObject(type: ContentType): LookupTable<unknown> {
	const values: LookupTable<unknown> = {};
	for (const fieldId in type.fields) {
		const field = type.fields[fieldId];
		values[fieldId] = createFieldValuesObject(field);
	}
	return values;
}

type ContentTypeFieldProperties = keyof ContentTypeField;
const ignoredContentTypeFieldProps: Array<ContentTypeFieldProperties> = ['sortable', 'values', 'type'];

export function createFieldValuesObject(field: ContentTypeField): LookupTable<unknown> {
	const values: LookupTable<unknown> = {};
	let property: ContentTypeFieldProperties;
	for (property in field) {
		if (ignoredContentTypeFieldProps.includes(property)) continue;
		if (property === 'fields') {
			values.fields = {};
			for (const fieldId in field.fields) {
				values.fields[fieldId] = createFieldValuesObject(field.fields[fieldId]);
			}
		} else if (property === 'properties') {
			populateFieldPropertiesValues(values, field.properties);
		} else if (property === 'validations') {
			populateFieldValidationsValues(values, field.validations);
		} else {
			values[contentTypeFieldToXmlNameMap[property] ?? property] = field[property];
		}
	}
	return values;
}

export function populateFieldPropertiesValues(
	values: LookupTable<unknown>,
	properties: ContentTypeField['properties']
): void {
	for (const property in properties ?? {}) {
		if (property === 'plugin') {
			console.error('Plugin case not handled.');
			// TODO: Not handled...
			continue;
		}
		const propObject = properties[property];
		values[property] = propObject.value;
	}
}

export function populateFieldValidationsValues(
	values: LookupTable<unknown>,
	validations: ContentTypeField['validations']
): void {
	let validationKey: ValidationKeys;
	for (validationKey in validations ?? {}) {
		// The maxlength property is mapped from properties to `field.validations`.
		// 	TODO: Should we use upgrade manager to remove from properties and into constraints?
		if (validationKey === 'maxLength') continue;
		const validationObject = validations[validationKey as ValidationKeys];
		values[validationKey] = validationObject.value;
	}
}

export type PartialContentType = Pick<ContentType, 'id' | 'name' | 'description' | 'sections' | 'fields'>;

export function createVirtualType(controlDescriptor: PartialContentType): ContentType {
	const typeTemplate: ContentType = {
		id: null,
		type: undefined,
		name: null,
		description: null,
		dataSources: null,
		displayTemplate: null,
		mergeStrategy: null,
		quickCreate: null,
		quickCreatePath: null,
		...controlDescriptor,
		fields: {
			...commonControlFieldsDescriptors,
			...controlDescriptor.fields
		},
		sections: [
			{
				title: 'Basic Properties',
				description: '',
				fields: Object.keys(commonControlFieldsDescriptors),
				expandByDefault: true
			},
			...(controlDescriptor.sections ?? [])
		]
	};
	return typeTemplate;
}

export function createVirtualSection(
	sectionData: Partial<ContentTypeSection> & Pick<ContentTypeSection, 'title' | 'fields'>
): ContentTypeSection {
	return { description: '', expandByDefault: true, ...sectionData };
}

export function createVirtualDataSourceFields(type: ContentType): LookupTable<ContentTypeField> {
	const dataSourceFields: LookupTable<ContentTypeField> = {};
	for (const dataSource of type.dataSources) {
		dataSourceFields[dataSource.id] = {
			id: dataSource.id,
			type: dataSource.type,
			name: dataSource.title,
			defaultValue: undefined,
			validations: foo
		};
	}
	return dataSourceFields;
}
