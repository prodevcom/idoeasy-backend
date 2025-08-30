export interface SwaggerContact {
  name: string;
  url: string;
  email: string;
}

export interface SwaggerLicense {
  name: string;
  url: string;
}

export interface SwaggerServer {
  url: string;
  description: string;
}

export interface SwaggerTag {
  name: string;
  description: string;
}

export interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  contact: SwaggerContact;
  license: SwaggerLicense;
  servers: SwaggerServer[];
  tags: SwaggerTag[];
}
