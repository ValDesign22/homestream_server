import { Request, Response } from "express";
import { getCollectionById } from "../utils/item";

const collectionHandler = async (req: Request, res: Response) => {
  const collectionId = req.query.id;

  if (!collectionId) return res.status(400).send("No collection id provided");

  let collection = getCollectionById(parseInt(collectionId as string, 10));

  res.status(200).json(collection);
}

export { collectionHandler };
