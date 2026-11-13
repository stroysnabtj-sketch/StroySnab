FROM postgres:18-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-boto3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /backup
COPY backup.py ./backup.py
COPY file_backup.py ./file_backup.py
ENTRYPOINT ["python3", "/backup/backup.py"]
