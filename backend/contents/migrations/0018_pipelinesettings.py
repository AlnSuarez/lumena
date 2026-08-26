from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contents', '0017_contentitem_pdf_media_type'),
    ]

    operations = [
        migrations.CreateModel(
            name='PipelineSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('require_qa_review', models.BooleanField(default=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Pipeline settings',
                'verbose_name_plural': 'Pipeline settings',
            },
        ),
    ]
