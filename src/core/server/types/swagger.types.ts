import { OpenAPIV3 } from 'openapi-types';
import ReferenceObject = OpenAPIV3.ReferenceObject;
import SecuritySchemeObject = OpenAPIV3.SecuritySchemeObject;

export type SecuritySchemes = Record<
  string,
  ReferenceObject | SecuritySchemeObject
>;
