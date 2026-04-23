import { formatDate } from "@/landing/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function Author({
  name,
  twitterUsername,
  image,
  updatedAt,
  imageOnly,
}: {
  name: string;
  image?: string;
  twitterUsername: string;
  updatedAt?: string;
  imageOnly?: boolean;
}) {
  // Show only the image (avatar) if imageOnly is true
  if (imageOnly) {
    return image ? (
      <Image
        src={image}
        alt={name}
        width={40}
        height={40}
        className="rounded-full"
      />
    ) : null;
  }

  // Updated at block without image
  if (updatedAt) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex flex-col">
          <p className="text-sm text-gray-500">
            Écrit par {name} / Written by {name}
          </p>
          <time
            dateTime={updatedAt}
            className="text-sm font-light text-gray-400"
          >
            Dernière mise à jour / Last updated {formatDate(updatedAt)}
          </time>
        </div>
      </div>
    );
  }

  // Author block with optional image
  return (
    <Link
      href={`https://twitter.com/${twitterUsername}`}
      className="group flex items-center space-x-3"
      target="_blank"
      rel="noopener noreferrer"
    >
      {image && (
        <Image
          src={image}
          alt={name}
          width={40}
          height={40}
          className="rounded-full transition-all group-hover:brightness-90"
        />
      )}
      <div className="flex flex-col">
        <p className="font-semibold text-gray-700">
          {name}
        </p>
        <p className="text-sm text-gray-500">
          @{twitterUsername}
        </p>
      </div>
    </Link>
  );
}
