from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contents', '0016_contentitem_rotation_alter_contentitem_id_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contentitem',
            name='media_type',
            field=models.CharField(
                choices=[
                    ('IMAGE', 'Image'),
                    ('VIDEO', 'Video'),
                    ('CAROUSEL_IMAGE', 'Carousel Image'),
                    ('STORY', 'Story'),
                    ('PDF', 'PDF'),
                ],
                default='IMAGE',
                max_length=20,
            ),
        ),
    ]
