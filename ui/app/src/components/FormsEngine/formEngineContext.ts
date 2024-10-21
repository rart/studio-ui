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

import { createContext, MutableRefObject, SyntheticEvent, useContext } from 'react';
import { ContentTypeField, SandboxItem } from '../../models';
import PluginDescriptor from '../../models/PluginDescriptor';
import ContentType from '../../models/ContentType';
import ApiResponse from '../../models/ApiResponse';
import { FormsEngineProps } from './FormEngine';
import LookupTable from '../../models/LookupTable';

export interface FormsEngineContextProps {
  activeTab: number;
  values: LookupTable<unknown>;
  contentDom: XMLDocument | Element;
  contentXml: string;
  contentType: ContentType;
  contentTypeXml: string;
  fieldHelpExpandedState: LookupTable<boolean>;
  fieldValidityState: LookupTable<{ isValid: boolean; messages: string[] }>;
  formsEngineExtensions: PluginDescriptor;
  formsStack: FormsEngineProps[];
  formsStackState: FormsEngineContextProps[];
  item: SandboxItem;
  locked: boolean;
  lockError: ApiResponse;
  pathInProject: string;
  previousScrollTopPosition: number;
  requirementsFetched: boolean;
  sectionExpandedState: LookupTable<boolean>;
}

export interface FormsEngineContextApi {
  update: {
    (newState: Partial<FormsEngineContextProps>): void;
    <K extends keyof FormsEngineContextProps>(key: K, value: FormsEngineContextProps[K]): void;
  };
  updateValue: (fieldId: string, value: unknown) => void;
  handleTabChange(event: SyntheticEvent, newValue: number): void;
  setAccordionExpandedState(sectionId: string, expanded: boolean): void;
  handleToggleSectionAccordion(event: SyntheticEvent, expanded: boolean): void;
  handleViewFieldHelpText(event: SyntheticEvent, field: ContentTypeField): void;
  pushForm(formProps: FormsEngineProps, openerFormState?: FormsEngineContextProps): void;
  popForm(): void;
}

export type FormEngineContextType = [FormsEngineContextProps, MutableRefObject<FormsEngineContextApi>];

export const FormEngineContext = createContext<FormEngineContextType>(null);

export function useFormEngineContext() {
  const context = useContext(FormEngineContext);
  if (!context) {
    throw new Error('useFormEngineContext must be used within a FormEngineContextProvider');
  }
  return context;
}
