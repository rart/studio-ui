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

import type { BuiltInControlType } from '../FormsEngine/lib/controlMap';
import { XmlKeys } from '../FormsEngine/lib/formConsts';
import { createVirtualSection, PartialContentType } from './utils';
import fileNameDescriptor from './control-descriptors/fileNameDescriptor';
import inputDescriptor from './control-descriptors/inputDescriptor';
import autoFileNameDescriptor from './control-descriptors/autoFileNameDescriptor';
import awsFileUploadDescriptor from './control-descriptors/awsFileUploadDescriptor';
import boxFileUploadDescriptor from './control-descriptors/boxFileUploadDescriptor';
import checkboxDescriptor from './control-descriptors/checkboxDescriptor';
import checkboxGroupDescriptor from './control-descriptors/checkboxGroupDescriptor';
import dateTimeDescriptor from './control-descriptors/dateTimeDescriptor';
import disabledDescriptor from './control-descriptors/disabledDescriptor';
import dropdownDescriptor from './control-descriptors/dropdownDescriptor';
import forceHttpsDescriptor from './control-descriptors/forceHttpsDescriptor';
import imagePickerDescriptor from './control-descriptors/imagePickerDescriptor';
import internalNameDescriptor from './control-descriptors/internalNameDescriptor';
import labelDescriptor from './control-descriptors/labelDescriptor';
import linkInputDescriptor from './control-descriptors/linkInputDescriptor';
import linkTextareaDescriptor from './control-descriptors/linkTextareaDescriptor';
import linkedDropdownDescriptor from './control-descriptors/linkedDropdownDescriptor';
import localeSelectorDescriptor from './control-descriptors/localeSelectorDescriptor';
import nodeSelectorDescriptor from './control-descriptors/nodeSelectorDescriptor';
import numericInputDescriptor from './control-descriptors/numericInputDescriptor';
import pageNavOrderDescriptor from './control-descriptors/pageNavOrderDescriptor';
import repeatDescriptor from './control-descriptors/repeatDescriptor';
import rteDescriptor from './control-descriptors/rteDescriptor';
import textareaDescriptor from './control-descriptors/textareaDescriptor';
import timeDescriptor from './control-descriptors/timeDescriptor';
import transcodedVideoPickerDescriptor from './control-descriptors/transcodedVideoPickerDescriptor';
import uuidDescriptor from './control-descriptors/uuidDescriptor';
import videoPickerDescriptor from './control-descriptors/videoPickerDescriptor';
import { foo } from '../../utils/object';
import ContentType, { ContentTypeField } from '../../models/ContentType';
import LookupTable from '../../models/LookupTable';

// Type
// Basic: Title, Description, ObjectType, Content Type Id, Preview Image, Configuration, Controller, Display Template, No Template Required, Merge Strategy,
// Quick Create: Show in Quick Create, Quick Create Path, Quick Create Destination Pattern
// <content-type name="/page/article" is-wcm-type="true">
// 	<label>Article</label>
// 	<form>/page/article</form>
// 	<form-path>simple</form-path>
// 	<model-instance-path>NOT-USED-BY-SIMPLE-FORM-ENGINE</model-instance-path>
// 	<file-extension>xml</file-extension>
// 	<content-as-folder>true</content-as-folder>
// 	<previewable>true</previewable>
// 	<quickCreate>true</quickCreate>
// 	<quickCreatePath>/site/website/articles/{year}/{month}</quickCreatePath>
// 	<noThumbnail>false</noThumbnail>
// 	<image-thumbnail>page-article.png</image-thumbnail>
// 	<paths>
// 		<includes>
// 			<pattern>^/site/website/articles/.*</pattern>
// 		</includes>
// 	</paths>
// </content-type>

// DataSource
// Basic: Title, Name
// Properties: ...

// const BaseTypeFields;

const dataSourceRootProperties = ['id', 'type', 'title', 'interface'];

const test = {
	properties: [],
	constraints: []
};

export const systemFieldsSection = createVirtualSection({
	title: 'System Fields',
	fields: [XmlKeys.modelId, XmlKeys.fileName, XmlKeys.internalName, XmlKeys.disabled, XmlKeys.placeInNav]
});

export const dataSourcesSection = createVirtualSection({
	title: 'Data Sources',
	fields: []
});

export const systemFieldsDescriptors: LookupTable<ContentTypeField> = {
	[XmlKeys.modelId]: {
		id: XmlKeys.modelId,
		type: 'label',
		name: 'Unique Identifier',
		defaultValue: undefined,
		validations: foo
	},
	[XmlKeys.fileName]: {
		id: XmlKeys.fileName,
		type: 'file-name',
		name: 'Page URL',
		defaultValue: undefined,
		validations: foo
	},
	[XmlKeys.internalName]: {
		id: XmlKeys.internalName,
		type: 'input',
		name: 'Internal Name',
		defaultValue: undefined,
		validations: foo
	},
	[XmlKeys.disabled]: {
		id: XmlKeys.disabled,
		type: 'checkbox',
		name: 'Disabled',
		defaultValue: undefined,
		validations: foo
	},
	[XmlKeys.placeInNav]: {
		id: XmlKeys.placeInNav,
		type: 'page-nav-order',
		name: 'Place in Navigation',
		defaultValue: undefined,
		validations: foo
	}
};

export const systemFieldsContentType: ContentType = {
	dataSources: [],
	description: '',
	displayTemplate: '',
	fields: systemFieldsDescriptors,
	id: '',
	mergeStrategy: '',
	name: '',
	quickCreate: false,
	quickCreatePath: '',
	sections: [],
	type: undefined
};

// export const systemFieldVirtualType = createV

// OOTB Control Customizations:
// - Can't change icon
// Remember form controller (js)
// expired

export const commonControlFieldsDescriptors: LookupTable<ContentTypeField> = {
	id: {
		id: 'id',
		type: 'input',
		name: 'Variable Name',
		defaultValue: undefined,
		validations: {
			required: { id: 'required', level: 'required', value: true }
		}
	},
	title: {
		id: 'title',
		type: 'input',
		name: 'Title',
		defaultValue: undefined,
		validations: {
			required: { id: 'required', level: 'required', value: true }
		}
	},
	description: {
		id: 'description',
		type: 'textarea',
		name: 'Description',
		description: 'A description shown to the user on the form',
		defaultValue: undefined,
		validations: foo
	},
	help: {
		id: 'help',
		type: 'rte',
		name: 'Help',
		description: 'An expanded description or help text with rich text capabilities',
		defaultValue: undefined,
		validations: foo
	},
	defaultValue: {
		id: 'defaultValue',
		type: 'textarea',
		name: 'Description',
		defaultValue: undefined,
		validations: foo
	}
};

export const controlDescriptors: Record<BuiltInControlType, PartialContentType> = {
	'auto-filename': autoFileNameDescriptor,
	'aws-file-upload': awsFileUploadDescriptor,
	'box-file-upload': boxFileUploadDescriptor,
	checkbox: checkboxDescriptor,
	'checkbox-group': checkboxGroupDescriptor,
	'date-time': dateTimeDescriptor,
	disabled: disabledDescriptor,
	dropdown: dropdownDescriptor,
	'file-name': fileNameDescriptor,
	forcehttps: forceHttpsDescriptor,
	'image-picker': imagePickerDescriptor,
	input: inputDescriptor,
	'internal-name': internalNameDescriptor,
	label: labelDescriptor,
	'link-input': linkInputDescriptor,
	'link-textarea': linkTextareaDescriptor,
	'linked-dropdown': linkedDropdownDescriptor,
	'locale-selector': localeSelectorDescriptor,
	'node-selector': nodeSelectorDescriptor,
	'numeric-input': numericInputDescriptor,
	'page-nav-order': pageNavOrderDescriptor,
	repeat: repeatDescriptor,
	rte: rteDescriptor,
	textarea: textareaDescriptor,
	time: timeDescriptor,
	'transcoded-video-picker': transcodedVideoPickerDescriptor,
	uuid: uuidDescriptor,
	'video-picker': videoPickerDescriptor
};

export default controlDescriptors;
