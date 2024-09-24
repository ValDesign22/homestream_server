import chalk from 'chalk';
import { Request, Response, Router as ExpressRouter } from 'express';

const ROUTE_METADATA_KEY = Symbol('route_metadata');

export enum HttpMethod {
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface RouteOptions {
  path: string;
  method: HttpMethod;
  query?: (string | SingleOption)[];
  body?: Option[];
}

export interface SingleOption {
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  name: string;
  match?: RegExp;
}

export interface ArrayOption {
  type: 'array';
  required: boolean;
  name: string;
  match?: RegExp;
  values: Option[];
}

export interface ObjectOption {
  type: 'object';
  required: boolean;
  name: string;
  match?: RegExp;
  keys: Option[];
}

export type Option = string | SingleOption | ArrayOption | ObjectOption;

export const Route = (options: RouteOptions) => {
  return (target: any, propertyKey: string, _: PropertyDescriptor) => {
    Reflect.defineMetadata(ROUTE_METADATA_KEY, options, target, propertyKey);
  }
}

export class Controller {
  protected sendResponse(res: Response, data: any, status: number = 200) {
    res.status(status).json(data);
  }

  protected sendError(res: Response, message: string, status: number = 500) {
    res.status(status).json({ message });
  }

  protected validateQuery(req: Request, res: Response, query: (string | SingleOption)[]): boolean {
    for (const param of query) {
      if (typeof param !== 'string') {
        const { type, required, name, match } = param;
        const value = req.query[name];

        if (required && !value) {
          this.sendError(res, `Missing required param: ${name}`, 400);
          return false;
        }

        if (value && type === 'number' && isNaN(parseInt(value as string))) {
          this.sendError(res, `Invalid number for param: ${name}`, 400);
          return false;
        }

        if (value && type === 'boolean' && value !== 'true' && value !== 'false') {
          this.sendError(res, `Invalid boolean for param: ${name}`, 400);
          return false;
        }

        if (value && match && !match.test(value as string)) {
          this.sendError(res, `Invalid value for param: ${name}`, 400);
          return false;
        }
      } else if (!req.query[param]) {
        this.sendError(res, `Missing required query param: ${param}`, 400);
        return false;
      }
    }
    return true;
  }

  protected validateArray(options: Option[], values: any): string | null {
    for (const arrayParam of options) {
      if (typeof arrayParam !== 'string') {
        if (arrayParam.type !== 'object') {
          const { type, required, name } = arrayParam;
          const arrayValue = values[name];

          if (required && !arrayValue) return `Missing required array param: ${name}`;

          if (arrayValue && type === 'number' && isNaN(parseInt(arrayValue as string))) return `Invalid number for array param: ${name}`;

          if (arrayValue && type === 'boolean' && arrayValue !== 'true' && arrayValue !== 'false') return `Invalid boolean for array param: ${name}`;

          if (arrayValue && type === 'array') {
            if (!Array.isArray(arrayValue)) return `Invalid array for array param: ${name}`;
            const isInvalid = this.validateArray(arrayParam.values, arrayValue);
            if (isInvalid) return isInvalid;
          }
        } else {
          for (const object of values) {
            const isInvalid = this.validateObject(arrayParam.keys, object);
            if (isInvalid) return isInvalid;
          }
        }
      } else if (!values[arrayParam]) return `Missing required array param: ${arrayParam}`;
    }

    return null;
  }

  protected validateObject(options: Option[], values: any): string | null {
    for (const objectParam of options) {
      if (typeof objectParam !== 'string') {
        const { type, required, name } = objectParam;
        console.log(objectParam);
        console.log(values);
        console.log(values[name]);
        const objectValue = values[name];

        console.log(required && !objectValue);

        if (required && !objectValue) return `Missing required object param: ${name}`;

        if (objectValue && type === 'number' && isNaN(parseInt(objectValue as string))) return `Invalid number for object param: ${name}`;

        if (objectValue && type === 'boolean' && objectValue !== 'true' && objectValue !== 'false') return `Invalid boolean for object param: ${name}`;

        if (objectValue && type === 'array') {
          if (!Array.isArray(objectValue)) return `Invalid array for object param: ${name}`;
          const isInvalid = this.validateArray(objectParam.values, objectValue);
          if (isInvalid) return isInvalid;
        }

        if (objectValue && type === 'object') {
          if (typeof objectValue !== 'object') return `Invalid object for object param: ${name}`;
          return this.validateObject(objectParam.keys, objectValue);
        }
      } else if (!values[objectParam]) return `Missing required object param: ${objectParam}`;
    }
    return null;
  }

  protected validateBody(req: Request, res: Response, body: Option[]): boolean {
    for (const param of body) {
      if (typeof param !== 'string') {
        const { type, required, name } = param;
        const value = req.body[name];

        if (required && !value) {
          this.sendError(res, `Missing required body param: ${name}`, 400);
          return false;
        }

        if (value && type === 'number' && isNaN(parseInt(value as string))) {
          this.sendError(res, `Invalid number for body param: ${name}`, 400);
          return false;
        }

        if (value && type === 'boolean' && value !== 'true' && value !== 'false') {
          this.sendError(res, `Invalid boolean for body param: ${name}`, 400);
          return false;
        }

        if (value && type === 'array') {
          if (!Array.isArray(value)) {
            this.sendError(res, `Invalid array for body param: ${name}`, 400);
            return false;
          }

          const isInvalid = this.validateArray(param.values, value);
          if (isInvalid) {
            this.sendError(res, isInvalid, 400);
            return false;
          }
        }

        if (value && type === 'object') {
          if (typeof value !== 'object') {
            this.sendError(res, `Invalid object for body param: ${name}`, 400);
            return false;
          }

          const isInvalid = this.validateObject(param.keys, value);
          if (isInvalid) {
            this.sendError(res, isInvalid, 400);
            return false;
          }
        }
      } else if (!req.body[param]) {
        this.sendError(res, `Missing required body param: ${param}`, 400);
        return false;
      }
    }

    return true;
  }
}

export class Router {
  public router: ExpressRouter;

  constructor(options: {
    controllers: any[];
  }) {
    const router = ExpressRouter();

    router.use((req, res, next) => {
      res.on('finish', () => console.log(`[${chalk.green('REQUEST')}] ${chalk.blue(req.method)} ${req.path} - ${res.statusCode}`));
      next();
    });

    options.controllers.forEach((controller) => this.registerRoutes(router, controller));
    this.router = router;
  }

  protected registerRoutes(router: ExpressRouter, controller: any) {
    const prototype = Object.getPrototypeOf(controller);
    const methods = Object.getOwnPropertyNames(prototype);

    methods.forEach((method) => {
      const routeOptions: RouteOptions = Reflect.getMetadata(ROUTE_METADATA_KEY, prototype, method);

      if (routeOptions) {
        const { path, method: httpMethod, query, body } = routeOptions;

        const handler = (req: Request, res: Response) => {
          if (query && !prototype.validateQuery(req, res, query)) return;
          if (body && !prototype.validateBody(req, res, body)) return;
          controller[method](req, res);
        };

        switch (httpMethod) {
          case HttpMethod.GET: router.get(path, handler); break;
          case HttpMethod.PATCH: router.patch(path, handler); break;
          case HttpMethod.POST: router.post(path, handler); break;
          case HttpMethod.PUT: router.put(path, handler); break;
          case HttpMethod.DELETE: router.delete(path, handler); break;
          default: throw new Error(`Unsupported HTTP method: ${httpMethod}`);
        }

        console.log(`[${chalk.green(`ROUTE`)}] ${chalk.blue(httpMethod)} ${path}`);
      }
    });
  }
}