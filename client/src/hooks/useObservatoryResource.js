import { useEffect, useState } from "react";

function useObservatoryResource(loader, initialData) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError("");

    loader()
      .then((result) => {
        if (!isMounted) return;
        setData(result);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError.message);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [loader]);

  return {
    data,
    error,
    isLoading,
  };
}

export default useObservatoryResource;
