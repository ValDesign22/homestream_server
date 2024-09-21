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
  query?: string[];
  body?: string[];
};

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

  protected validateQuery(req: Request, res: Response, query: string[]) {
    for (const param of query) {
      if (!req.query[param]) {
        this.sendError(res, `Missing required param: ${param}`, 400);
        return false;
      }
    }
    return true;
  }

  protected validateBody(req: Request, res: Response, body: string[]) {
    for (const param of body) {
      if (!req.body[param]) {
        this.sendError(res, `Missing required body field: ${param}`, 400);
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
    logger: boolean;
  }) {
    const router = ExpressRouter();

    if (options.logger) router.use((req, res, next) => {
      res.on('finish', () => {
        console.log(`${chalk.blue(req.method)} ${req.path} - ${res.statusCode}`);
      });

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